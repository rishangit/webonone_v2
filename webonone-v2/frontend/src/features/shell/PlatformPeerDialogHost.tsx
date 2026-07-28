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
  sendPlatformPeerDialogSecondary,
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
  const [deepNested, setDeepNested] = useState<NestedPeerDialog | null>(null)
  const [footerBusy, setFooterBusy] = useState(false)
  const [submitLabel, setSubmitLabel] = useState<string | null>('Save')
  const [secondaryLabel, setSecondaryLabel] = useState<string | null>(null)
  const [description, setDescription] = useState<string | undefined>()
  const [nestedFooterBusy, setNestedFooterBusy] = useState(false)
  const [nestedSubmitLabel, setNestedSubmitLabel] = useState<string | null>('Create')
  const [nestedSecondaryLabel, setNestedSecondaryLabel] = useState<string | null>(null)
  const [nestedDescription, setNestedDescription] = useState<string | undefined>()
  const [deepNestedFooterBusy, setDeepNestedFooterBusy] = useState(false)
  const [deepNestedSubmitLabel, setDeepNestedSubmitLabel] = useState<string | null>('Create')
  const [deepNestedSecondaryLabel, setDeepNestedSecondaryLabel] = useState<string | null>(null)
  const [deepNestedDescription, setDeepNestedDescription] = useState<string | undefined>()
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const [blockNestedDismiss, setBlockNestedDismiss] = useState(false)
  const activeResponderRef = useRef<PlatformPeerDialogResponder | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const nestedIframeRef = useRef<HTMLIFrameElement>(null)
  const deepNestedIframeRef = useRef<HTMLIFrameElement>(null)
  const openSequenceRef = useRef(0)
  const nestedOpenRef = useRef(false)
  const deepNestedOpenRef = useRef(false)
  const blockOuterDismissRef = useRef(false)
  const blockNestedDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)
  const nestedBlockTimerRef = useRef<number | null>(null)

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

  const deepNestedIframeSrc = useMemo(() => {
    if (!deepNested) {
      return null
    }
    if (!isAllowedPlatformPeerDialogPath(deepNested.request.path)) {
      return null
    }
    return buildPlatformEmbedUrl({
      peerOrigin: deepNested.peerOrigin,
      path: deepNested.request.path,
      parentOrigin: hostOrigin,
      scope: 'peer-dialog-nested',
      searchParams: {
        [PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID]: deepNested.request.requestId,
      },
    })
  }, [deepNested, hostOrigin])

  useEffect(() => {
    nestedOpenRef.current = Boolean(nested)
  }, [nested])

  useEffect(() => {
    deepNestedOpenRef.current = Boolean(deepNested)
  }, [deepNested])

  useEffect(() => {
    return () => {
      activeResponderRef.current?.cancel('unmounted')
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
      if (nestedBlockTimerRef.current !== null) {
        window.clearTimeout(nestedBlockTimerRef.current)
      }
    }
  }, [])

  const armOuterDismissGuard = useCallback(() => {
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
  }, [])

  const armNestedDismissGuard = useCallback(() => {
    blockNestedDismissRef.current = true
    setBlockNestedDismiss(true)
    if (nestedBlockTimerRef.current !== null) {
      window.clearTimeout(nestedBlockTimerRef.current)
    }
    nestedBlockTimerRef.current = window.setTimeout(() => {
      blockNestedDismissRef.current = false
      setBlockNestedDismiss(false)
      nestedBlockTimerRef.current = null
    }, 150)
  }, [])

  const clearActive = useCallback(() => {
    activeResponderRef.current = null
    setFooterBusy(false)
    setDeepNested(null)
    setDeepNestedFooterBusy(false)
    deepNestedOpenRef.current = false
    setNested(null)
    setNestedFooterBusy(false)
    nestedOpenRef.current = false
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

  const closeDeepNestedDialog = useCallback(
    (reason = 'cancelled') => {
      const current = deepNested
      setDeepNested(null)
      setDeepNestedFooterBusy(false)
      deepNestedOpenRef.current = false
      armNestedDismissGuard()

      const nestedWin = nestedIframeRef.current?.contentWindow
      if (current && nestedWin && peerOriginNormalized) {
        sendPlatformPeerDialogNestedCancel(
          nestedWin,
          peerOriginNormalized,
          current.request.parentRequestId,
          current.request.requestId,
          reason,
        )
      }
    },
    [armNestedDismissGuard, deepNested, peerOriginNormalized],
  )

  const completeDeepNestedDialog = useCallback(
    (payload?: unknown) => {
      const current = deepNested
      setDeepNested(null)
      setDeepNestedFooterBusy(false)
      deepNestedOpenRef.current = false
      armNestedDismissGuard()

      const nestedWin = nestedIframeRef.current?.contentWindow
      if (current && nestedWin && peerOriginNormalized) {
        sendPlatformPeerDialogNestedResult(
          nestedWin,
          peerOriginNormalized,
          current.request.parentRequestId,
          current.request.requestId,
          payload,
        )
      }
    },
    [armNestedDismissGuard, deepNested, peerOriginNormalized],
  )

  const closeNestedDialog = useCallback(
    (reason = 'cancelled') => {
      if (deepNestedOpenRef.current || deepNested) {
        closeDeepNestedDialog(reason)
        return
      }

      const current = nested
      setNested(null)
      setNestedFooterBusy(false)
      nestedOpenRef.current = false
      armOuterDismissGuard()

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
    [armOuterDismissGuard, closeDeepNestedDialog, deepNested, nested, peerOriginNormalized],
  )

  const completeNestedDialog = useCallback(
    (payload?: unknown) => {
      if (deepNestedOpenRef.current || deepNested) {
        closeDeepNestedDialog('cancelled')
        return
      }

      const current = nested
      setNested(null)
      setNestedFooterBusy(false)
      nestedOpenRef.current = false
      armOuterDismissGuard()

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
    [armOuterDismissGuard, closeDeepNestedDialog, deepNested, nested, peerOriginNormalized],
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
      setSubmitLabel(request.submitLabel ?? null)
      setSecondaryLabel(request.secondaryLabel ?? null)
      setDescription(request.description)
      setDeepNested(null)
      setDeepNestedFooterBusy(false)
      setDeepNestedSecondaryLabel(null)
      setDeepNestedDescription(undefined)
      setNested(null)
      setNestedFooterBusy(false)
      setNestedSecondaryLabel(null)
      setNestedDescription(undefined)
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
      const deepNestedIframe = deepNestedIframeRef.current
      const fromOuter =
        iframe &&
        event.origin === peerOriginNormalized &&
        event.source === iframe.contentWindow
      const fromNested =
        nestedIframe &&
        event.origin === peerOriginNormalized &&
        event.source === nestedIframe.contentWindow
      const fromDeepNested =
        deepNestedIframe &&
        event.origin === peerOriginNormalized &&
        event.source === deepNestedIframe.contentWindow

      if (!fromOuter && !fromNested && !fromDeepNested) {
        return
      }

      if (isPlatformReadyMessage(event.data)) {
        if (fromOuter) {
          deliverInit()
        } else if (fromNested && nestedIframe && accessToken) {
          sendPlatformInit(nestedIframe, peerOriginNormalized, accessToken)
        } else if (fromDeepNested && deepNestedIframe && accessToken) {
          sendPlatformInit(deepNestedIframe, peerOriginNormalized, accessToken)
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
        setDeepNested(null)
        setDeepNestedFooterBusy(false)
        setNestedSubmitLabel(event.data.submitLabel ?? null)
        setNestedSecondaryLabel(event.data.secondaryLabel ?? null)
        setNestedDescription(event.data.description)
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
        if (event.data.description !== undefined) {
          setDescription(event.data.description)
        }
        if (event.data.secondaryLabel !== undefined) {
          setSecondaryLabel(event.data.secondaryLabel)
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

      if (fromNested && isPlatformPeerDialogNestedRequestMessage(event.data)) {
        if (event.data.parentRequestId !== nestedRequestId) {
          return
        }
        if (!isAllowedPlatformPeerDialogPath(event.data.path)) {
          return
        }
        openSequenceRef.current += 1
        deepNestedOpenRef.current = true
        setDeepNestedSubmitLabel(event.data.submitLabel ?? null)
        setDeepNestedSecondaryLabel(event.data.secondaryLabel ?? null)
        setDeepNestedDescription(event.data.description)
        setDeepNestedFooterBusy(false)
        setDeepNested({
          request: event.data,
          peerOrigin: active!.peerOrigin,
          openKey: openSequenceRef.current,
        })
        return
      }

      if (
        fromNested &&
        isPlatformPeerDialogBusyMessage(event.data) &&
        event.data.requestId === nestedRequestId
      ) {
        setNestedFooterBusy(event.data.busy)
        if (event.data.submitLabel) {
          setNestedSubmitLabel(event.data.submitLabel)
        }
        if (event.data.description !== undefined) {
          setNestedDescription(event.data.description)
        }
        if (event.data.secondaryLabel !== undefined) {
          setNestedSecondaryLabel(event.data.secondaryLabel)
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
        return
      }

      if (!deepNested) {
        return
      }

      const deepNestedRequestId = deepNested.request.requestId

      if (
        fromDeepNested &&
        isPlatformPeerDialogBusyMessage(event.data) &&
        event.data.requestId === deepNestedRequestId
      ) {
        setDeepNestedFooterBusy(event.data.busy)
        if (event.data.submitLabel) {
          setDeepNestedSubmitLabel(event.data.submitLabel ?? null)
        }
        if (event.data.description !== undefined) {
          setDeepNestedDescription(event.data.description)
        }
        if (event.data.secondaryLabel !== undefined) {
          setDeepNestedSecondaryLabel(event.data.secondaryLabel)
        }
        return
      }

      if (
        fromDeepNested &&
        isPlatformPeerDialogCompleteMessage(event.data) &&
        event.data.requestId === deepNestedRequestId
      ) {
        completeDeepNestedDialog(event.data.payload)
        return
      }

      if (
        fromDeepNested &&
        isPlatformPeerDialogCancelMessage(event.data) &&
        event.data.requestId === deepNestedRequestId
      ) {
        closeDeepNestedDialog(event.data.reason ?? 'cancelled')
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
    closeDeepNestedDialog,
    closeNestedDialog,
    completeDeepNestedDialog,
    completeNestedDialog,
    deepNested,
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

  useEffect(() => {
    if (!deepNested || !deepNestedIframeSrc || !peerOriginNormalized || !accessToken) {
      return
    }

    function deliverDeepNestedInit() {
      const iframe = deepNestedIframeRef.current
      if (!iframe || !accessToken) {
        return
      }
      sendPlatformInit(iframe, peerOriginNormalized, accessToken)
    }

    function handleLoad() {
      deliverDeepNestedInit()
    }

    const iframe = deepNestedIframeRef.current
    iframe?.addEventListener('load', handleLoad)
    return () => iframe?.removeEventListener('load', handleLoad)
  }, [accessToken, deepNested, deepNestedIframeSrc, peerOriginNormalized])

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (
        deepNestedOpenRef.current ||
        deepNested ||
        nestedOpenRef.current ||
        blockOuterDismissRef.current ||
        blockOuterDismiss
      ) {
        if (deepNestedOpenRef.current || deepNested) {
          closeDeepNestedDialog('cancelled')
          return
        }
        if (nestedOpenRef.current || nested) {
          closeNestedDialog('cancelled')
        }
        return
      }
      cancelActive('cancelled')
    }
  }

  function handleFooterSubmit() {
    if (nestedOpenRef.current || nested || deepNestedOpenRef.current || deepNested) {
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

  function handleFooterSecondary() {
    if (nestedOpenRef.current || nested || deepNestedOpenRef.current || deepNested) {
      return
    }
    const iframe = iframeRef.current
    if (!active || !iframe?.contentWindow) {
      return
    }
    sendPlatformPeerDialogSecondary(
      iframe.contentWindow,
      peerOriginNormalized,
      active.request.requestId,
    )
  }

  function handleNestedFooterSubmit() {
    if (deepNestedOpenRef.current || deepNested) {
      return
    }
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

  function handleNestedFooterSecondary() {
    if (deepNestedOpenRef.current || deepNested) {
      return
    }
    const iframe = nestedIframeRef.current
    if (!nested || !iframe?.contentWindow) {
      return
    }
    sendPlatformPeerDialogSecondary(
      iframe.contentWindow,
      peerOriginNormalized,
      nested.request.requestId,
    )
  }

  function handleDeepNestedFooterSubmit() {
    const iframe = deepNestedIframeRef.current
    if (!deepNested || !iframe?.contentWindow) {
      return
    }
    sendPlatformPeerDialogSubmit(
      iframe.contentWindow,
      peerOriginNormalized,
      deepNested.request.requestId,
    )
  }

  function handleDeepNestedFooterSecondary() {
    const iframe = deepNestedIframeRef.current
    if (!deepNested || !iframe?.contentWindow) {
      return
    }
    sendPlatformPeerDialogSecondary(
      iframe.contentWindow,
      peerOriginNormalized,
      deepNested.request.requestId,
    )
  }

  const cancelLabel = active?.request.cancelLabel ?? 'Cancel'
  const nestedCancelLabel = nested?.request.cancelLabel ?? 'Cancel'
  const deepNestedCancelLabel = deepNested?.request.cancelLabel ?? 'Cancel'
  const nestedOpen = Boolean(nested)
  const deepNestedOpen = Boolean(deepNested)

  return (
    <PlatformPeerDialogContext.Provider value={{ openPeerDialog }}>
      {children}
      {active && iframeSrc ? (
        <CustomDialog
          open
          onOpenChange={handleOpenChange}
          title={active.request.title}
          description={description}
          sizeWidth={active.request.sizeWidth}
          sizeHeight={active.request.sizeHeight}
          noContentPadding
          disableContentScroll={active.request.sizeHeight !== 'auto'}
          nestedDismissGuard={nestedOpen || deepNestedOpen || blockOuterDismiss}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={footerBusy || nestedOpen || deepNestedOpen}
                onClick={() => cancelActive('cancelled')}
              >
                {cancelLabel}
              </Button>
              {secondaryLabel ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={footerBusy || nestedOpen || deepNestedOpen}
                  onClick={handleFooterSecondary}
                >
                  {secondaryLabel}
                </Button>
              ) : null}
              {submitLabel ? (
                <Button
                  type="button"
                  disabled={!accessToken || footerBusy || nestedOpen || deepNestedOpen}
                  onClick={handleFooterSubmit}
                >
                  {submitLabel}
                </Button>
              ) : null}
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
              if (deepNestedOpenRef.current || deepNested || blockNestedDismissRef.current || blockNestedDismiss) {
                if (deepNestedOpenRef.current || deepNested) {
                  closeDeepNestedDialog('cancelled')
                }
                return
              }
              closeNestedDialog('cancelled')
            }
          }}
          title={nested.request.title}
          description={nestedDescription}
          sizeWidth={nested.request.sizeWidth}
          sizeHeight={nested.request.sizeHeight}
          noContentPadding
          disableContentScroll={nested.request.sizeHeight !== 'auto'}
          stackLevel={1}
          nestedDismissGuard={deepNestedOpen || blockNestedDismiss}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                className="h-10 px-4"
                disabled={nestedFooterBusy || deepNestedOpen}
                onClick={(event) => {
                  event.stopPropagation()
                  closeNestedDialog('cancelled')
                }}
              >
                {nestedCancelLabel}
              </Button>
              {nestedSecondaryLabel ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4"
                  disabled={nestedFooterBusy || deepNestedOpen}
                  onClick={handleNestedFooterSecondary}
                >
                  {nestedSecondaryLabel}
                </Button>
              ) : null}
              {nestedSubmitLabel ? (
                <Button
                  type="button"
                  className="h-10 px-4"
                  disabled={!accessToken || nestedFooterBusy || deepNestedOpen}
                  onClick={handleNestedFooterSubmit}
                >
                  {nestedSubmitLabel}
                </Button>
              ) : null}
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

      {deepNested && deepNestedIframeSrc ? (
        <CustomDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              closeDeepNestedDialog('cancelled')
            }
          }}
          title={deepNested.request.title}
          description={deepNestedDescription}
          sizeWidth={deepNested.request.sizeWidth}
          sizeHeight={deepNested.request.sizeHeight}
          noContentPadding
          disableContentScroll={deepNested.request.sizeHeight !== 'auto'}
          stackLevel={2}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                className="h-10 px-4"
                disabled={deepNestedFooterBusy}
                onClick={(event) => {
                  event.stopPropagation()
                  closeDeepNestedDialog('cancelled')
                }}
              >
                {deepNestedCancelLabel}
              </Button>
              {deepNestedSecondaryLabel ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-4"
                  disabled={deepNestedFooterBusy}
                  onClick={handleDeepNestedFooterSecondary}
                >
                  {deepNestedSecondaryLabel}
                </Button>
              ) : null}
              {deepNestedSubmitLabel ? (
                <Button
                  type="button"
                  className="h-10 px-4"
                  disabled={!accessToken || deepNestedFooterBusy}
                  onClick={handleDeepNestedFooterSubmit}
                >
                  {deepNestedSubmitLabel}
                </Button>
              ) : null}
            </>
          }
        >
          <iframe
            key={deepNested.openKey}
            ref={deepNestedIframeRef}
            src={deepNestedIframeSrc}
            title={deepNested.request.title}
            className={`block w-full border-0 bg-transparent ${iframeHeightClass(
              deepNested.request.sizeHeight,
              deepNested.request.sizeWidth,
            )}`}
          />
        </CustomDialog>
      ) : null}
    </PlatformPeerDialogContext.Provider>
  )
}
