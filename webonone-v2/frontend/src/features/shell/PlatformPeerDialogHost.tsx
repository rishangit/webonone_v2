import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  buildPlatformEmbedUrl,
  isAllowedPlatformPeerDialogPath,
  isPlatformPeerDialogBusyMessage,
  isPlatformPeerDialogCancelMessage,
  isPlatformPeerDialogCompleteMessage,
  isPlatformPeerDialogNestedRequestMessage,
  isPlatformReadyMessage,
  PLATFORM_EMBED_QUERY,
  sendPlatformInit,
  sendPlatformPeerDialogNestedCancel,
  sendPlatformPeerDialogNestedResult,
  sendPlatformPeerDialogSubmit,
  type PlatformPeerDialogNestedRequestMessage,
  type PlatformPeerDialogRequestMessage,
  type PlatformPeerDialogResponder,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { PlatformPeerDialogContext } from '@/features/shell/PlatformPeerDialogContext'

type ActivePeerDialog = {
  request: PlatformPeerDialogRequestMessage
  peerOrigin: string
  openKey: number
}

type NestedPeerDialog = {
  request: PlatformPeerDialogNestedRequestMessage
  peerOrigin: string
  openKey: number
}

function iframeHeightClass(sizeHeight: string, sizeWidth: string): string {
  if (sizeHeight !== 'auto') {
    return 'h-full min-h-0'
  }
  if (sizeWidth === 'small') {
    return 'min-h-[280px] h-[min(50vh,420px)]'
  }
  if (sizeWidth === 'medium') {
    return 'min-h-[320px] h-[min(60vh,560px)]'
  }
  if (sizeWidth === 'large' || sizeWidth === 'xlarge') {
    return 'min-h-[360px] h-[min(70vh,720px)]'
  }
  return 'min-h-[280px] h-[min(55vh,480px)]'
}

export function PlatformPeerDialogProvider({ children }: { children: ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [active, setActive] = useState<ActivePeerDialog | null>(null)
  const [nested, setNested] = useState<NestedPeerDialog | null>(null)
  const [footerBusy, setFooterBusy] = useState(false)
  const [submitLabel, setSubmitLabel] = useState('Save')
  const [nestedFooterBusy, setNestedFooterBusy] = useState(false)
  const [nestedSubmitLabel, setNestedSubmitLabel] = useState('Create')
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const activeResponderRef = useRef<PlatformPeerDialogResponder | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const nestedIframeRef = useRef<HTMLIFrameElement>(null)
  const openSequenceRef = useRef(0)
  const nestedOpenRef = useRef(false)
  const blockOuterDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)

  const hostOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const peerOriginNormalized = useMemo(
    () => (active ? new URL(active.peerOrigin).origin : ''),
    [active],
  )

  const iframeSrc = useMemo(() => {
    if (!active) {
      return null
    }
    if (!isAllowedPlatformPeerDialogPath(active.request.path)) {
      return null
    }
    return buildPlatformEmbedUrl({
      peerOrigin: active.peerOrigin,
      path: active.request.path,
      parentOrigin: hostOrigin,
      scope: 'peer-dialog',
      searchParams: {
        [PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID]: active.request.requestId,
      },
    })
  }, [active, hostOrigin])

  const nestedIframeSrc = useMemo(() => {
    if (!nested) {
      return null
    }
    if (!isAllowedPlatformPeerDialogPath(nested.request.path)) {
      return null
    }
    return buildPlatformEmbedUrl({
      peerOrigin: nested.peerOrigin,
      path: nested.request.path,
      parentOrigin: hostOrigin,
      scope: 'peer-dialog-nested',
      searchParams: {
        [PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID]: nested.request.requestId,
      },
    })
  }, [hostOrigin, nested])

  useEffect(() => {
    nestedOpenRef.current = Boolean(nested)
  }, [nested])

  useEffect(() => {
    return () => {
      activeResponderRef.current?.cancel('unmounted')
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  const clearActive = useCallback(() => {
    activeResponderRef.current = null
    setFooterBusy(false)
    setNested(null)
    setNestedFooterBusy(false)
    setActive(null)
  }, [])

  const cancelActive = useCallback(
    (reason = 'cancelled') => {
      activeResponderRef.current?.cancel(reason)
      clearActive()
    },
    [clearActive],
  )

  const resolveActive = useCallback(
    (payload?: unknown) => {
      activeResponderRef.current?.resolve(payload)
      clearActive()
    },
    [clearActive],
  )

  const closeNestedDialog = useCallback(
    (reason = 'cancelled') => {
      const current = nested
      setNested(null)
      setNestedFooterBusy(false)
      nestedOpenRef.current = false
      blockOuterDismissRef.current = true
      setBlockOuterDismiss(true)
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
      blockTimerRef.current = window.setTimeout(() => {
        blockOuterDismissRef.current = false
        setBlockOuterDismiss(false)
        blockTimerRef.current = null
      }, 150)

      const outer = iframeRef.current?.contentWindow
      if (current && outer && peerOriginNormalized) {
        sendPlatformPeerDialogNestedCancel(
          outer,
          peerOriginNormalized,
          current.request.parentRequestId,
          current.request.requestId,
          reason,
        )
      }
    },
    [nested, peerOriginNormalized],
  )

  const completeNestedDialog = useCallback(
    (payload?: unknown) => {
      const current = nested
      setNested(null)
      setNestedFooterBusy(false)
      nestedOpenRef.current = false
      blockOuterDismissRef.current = true
      setBlockOuterDismiss(true)
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
      blockTimerRef.current = window.setTimeout(() => {
        blockOuterDismissRef.current = false
        setBlockOuterDismiss(false)
        blockTimerRef.current = null
      }, 150)

      const outer = iframeRef.current?.contentWindow
      if (current && outer && peerOriginNormalized) {
        sendPlatformPeerDialogNestedResult(
          outer,
          peerOriginNormalized,
          current.request.parentRequestId,
          current.request.requestId,
          payload,
        )
      }
    },
    [nested, peerOriginNormalized],
  )

  const openPeerDialog = useCallback(
    (
      request: PlatformPeerDialogRequestMessage,
      responder: PlatformPeerDialogResponder,
      peerOrigin: string,
    ) => {
      if (!isAllowedPlatformPeerDialogPath(request.path)) {
        responder.cancel('invalid-path')
        return
      }

      activeResponderRef.current?.cancel('replaced')
      openSequenceRef.current += 1
      activeResponderRef.current = responder
      setFooterBusy(false)
      setSubmitLabel(request.submitLabel)
      setNested(null)
      setNestedFooterBusy(false)
      setActive({
        request,
        peerOrigin,
        openKey: openSequenceRef.current,
      })
    },
    [],
  )

  useEffect(() => {
    if (!active || !iframeSrc || !peerOriginNormalized) {
      return
    }

    const requestId = active.request.requestId

    function deliverInit() {
      const iframe = iframeRef.current
      if (!iframe || !accessToken) {
        return
      }
      sendPlatformInit(iframe, peerOriginNormalized, accessToken)
    }

    function handleLoad() {
      deliverInit()
    }

    function handleMessage(event: MessageEvent) {
      const iframe = iframeRef.current
      const nestedIframe = nestedIframeRef.current
      const fromOuter =
        iframe &&
        event.origin === peerOriginNormalized &&
        event.source === iframe.contentWindow
      const fromNested =
        nestedIframe &&
        event.origin === peerOriginNormalized &&
        event.source === nestedIframe.contentWindow

      if (!fromOuter && !fromNested) {
        return
      }

      if (isPlatformReadyMessage(event.data)) {
        if (fromOuter) {
          deliverInit()
        } else if (fromNested && nestedIframe && accessToken) {
          sendPlatformInit(nestedIframe, peerOriginNormalized, accessToken)
        }
        return
      }

      if (fromOuter && isPlatformPeerDialogNestedRequestMessage(event.data)) {
        if (event.data.parentRequestId !== requestId) {
          return
        }
        if (!isAllowedPlatformPeerDialogPath(event.data.path)) {
          return
        }
        openSequenceRef.current += 1
        nestedOpenRef.current = true
        setNestedSubmitLabel(event.data.submitLabel)
        setNestedFooterBusy(false)
        setNested({
          request: event.data,
          peerOrigin: active!.peerOrigin,
          openKey: openSequenceRef.current,
        })
        return
      }

      if (
        fromOuter &&
        isPlatformPeerDialogBusyMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        setFooterBusy(event.data.busy)
        if (event.data.submitLabel) {
          setSubmitLabel(event.data.submitLabel)
        }
        return
      }

      if (
        fromOuter &&
        isPlatformPeerDialogCompleteMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        resolveActive(event.data.payload)
        return
      }

      if (
        fromOuter &&
        isPlatformPeerDialogCancelMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        cancelActive(event.data.reason ?? 'cancelled')
        return
      }

      if (!nested) {
        return
      }

      const nestedRequestId = nested.request.requestId

      if (
        fromNested &&
        isPlatformPeerDialogBusyMessage(event.data) &&
        event.data.requestId === nestedRequestId
      ) {
        setNestedFooterBusy(event.data.busy)
        if (event.data.submitLabel) {
          setNestedSubmitLabel(event.data.submitLabel)
        }
        return
      }

      if (
        fromNested &&
        isPlatformPeerDialogCompleteMessage(event.data) &&
        event.data.requestId === nestedRequestId
      ) {
        completeNestedDialog(event.data.payload)
        return
      }

      if (
        fromNested &&
        isPlatformPeerDialogCancelMessage(event.data) &&
        event.data.requestId === nestedRequestId
      ) {
        closeNestedDialog(event.data.reason ?? 'cancelled')
      }
    }

    const iframe = iframeRef.current
    iframe?.addEventListener('load', handleLoad)
    window.addEventListener('message', handleMessage)

    return () => {
      iframe?.removeEventListener('load', handleLoad)
      window.removeEventListener('message', handleMessage)
    }
  }, [
    accessToken,
    active,
    cancelActive,
    closeNestedDialog,
    completeNestedDialog,
    iframeSrc,
    nested,
    peerOriginNormalized,
    resolveActive,
  ])

  useEffect(() => {
    if (!nested || !nestedIframeSrc || !peerOriginNormalized || !accessToken) {
      return
    }

    function deliverNestedInit() {
      const iframe = nestedIframeRef.current
      if (!iframe || !accessToken) {
        return
      }
      sendPlatformInit(iframe, peerOriginNormalized, accessToken)
    }

    function handleLoad() {
      deliverNestedInit()
    }

    const iframe = nestedIframeRef.current
    iframe?.addEventListener('load', handleLoad)
    return () => iframe?.removeEventListener('load', handleLoad)
  }, [accessToken, nested, nestedIframeSrc, peerOriginNormalized])

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (nestedOpenRef.current || blockOuterDismissRef.current || blockOuterDismiss) {
        if (nestedOpenRef.current || nested) {
          closeNestedDialog('cancelled')
        }
        return
      }
      cancelActive('cancelled')
    }
  }

  function handleFooterSubmit() {
    if (nestedOpenRef.current || nested) {
      return
    }
    const iframe = iframeRef.current
    if (!active || !iframe?.contentWindow) {
      return
    }
    sendPlatformPeerDialogSubmit(
      iframe.contentWindow,
      peerOriginNormalized,
      active.request.requestId,
    )
  }

  function handleNestedFooterSubmit() {
    const iframe = nestedIframeRef.current
    if (!nested || !iframe?.contentWindow) {
      return
    }
    sendPlatformPeerDialogSubmit(
      iframe.contentWindow,
      peerOriginNormalized,
      nested.request.requestId,
    )
  }

  const cancelLabel = active?.request.cancelLabel ?? 'Cancel'
  const nestedCancelLabel = nested?.request.cancelLabel ?? 'Cancel'
  const nestedOpen = Boolean(nested)

  return (
    <PlatformPeerDialogContext.Provider value={{ openPeerDialog }}>
      {children}
      {active && iframeSrc ? (
        <CustomDialog
          open
          onOpenChange={handleOpenChange}
          title={active.request.title}
          description={active.request.description}
          sizeWidth={active.request.sizeWidth}
          sizeHeight={active.request.sizeHeight}
          noContentPadding
          disableContentScroll={active.request.sizeHeight !== 'auto'}
          nestedDismissGuard={nestedOpen || blockOuterDismiss}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={footerBusy || nestedOpen}
                onClick={() => cancelActive('cancelled')}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                disabled={!accessToken || footerBusy || nestedOpen}
                onClick={handleFooterSubmit}
              >
                {submitLabel}
              </Button>
            </>
          }
        >
          {!accessToken ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">Waiting for authentication...</p>
            </div>
          ) : (
            <iframe
              key={active.openKey}
              ref={iframeRef}
              src={iframeSrc}
              title={active.request.title}
              className={`block w-full border-0 bg-transparent ${iframeHeightClass(
                active.request.sizeHeight,
                active.request.sizeWidth,
              )}`}
            />
          )}
        </CustomDialog>
      ) : null}

      {nested && nestedIframeSrc ? (
        <CustomDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              closeNestedDialog('cancelled')
            }
          }}
          title={nested.request.title}
          description={nested.request.description}
          sizeWidth={nested.request.sizeWidth}
          sizeHeight={nested.request.sizeHeight}
          noContentPadding
          disableContentScroll={nested.request.sizeHeight !== 'auto'}
          stackLevel={1}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                className="h-10 px-4"
                disabled={nestedFooterBusy}
                onClick={(event) => {
                  event.stopPropagation()
                  closeNestedDialog('cancelled')
                }}
              >
                {nestedCancelLabel}
              </Button>
              <Button
                type="button"
                className="h-10 px-4"
                disabled={!accessToken || nestedFooterBusy}
                onClick={handleNestedFooterSubmit}
              >
                {nestedSubmitLabel}
              </Button>
            </>
          }
        >
          <iframe
            key={nested.openKey}
            ref={nestedIframeRef}
            src={nestedIframeSrc}
            title={nested.request.title}
            className={`block w-full border-0 bg-transparent ${iframeHeightClass(
              nested.request.sizeHeight,
              nested.request.sizeWidth,
            )}`}
          />
        </CustomDialog>
      ) : null}
    </PlatformPeerDialogContext.Provider>
  )
}
