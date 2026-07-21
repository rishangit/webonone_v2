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
  isPlatformReadyMessage,
  PLATFORM_EMBED_QUERY,
  sendPlatformInit,
  sendPlatformPeerDialogSubmit,
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
  const [footerBusy, setFooterBusy] = useState(false)
  const [submitLabel, setSubmitLabel] = useState('Save')
  const activeResponderRef = useRef<PlatformPeerDialogResponder | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const openSequenceRef = useRef(0)

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

  useEffect(() => {
    return () => {
      activeResponderRef.current?.cancel('unmounted')
    }
  }, [])

  const clearActive = useCallback(() => {
    activeResponderRef.current = null
    setFooterBusy(false)
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
      if (
        !iframe ||
        event.origin !== peerOriginNormalized ||
        event.source !== iframe.contentWindow
      ) {
        return
      }

      if (isPlatformReadyMessage(event.data)) {
        deliverInit()
        return
      }

      if (
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
        isPlatformPeerDialogCompleteMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        resolveActive(event.data.payload)
        return
      }

      if (
        isPlatformPeerDialogCancelMessage(event.data) &&
        event.data.requestId === requestId
      ) {
        cancelActive(event.data.reason ?? 'cancelled')
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
    iframeSrc,
    peerOriginNormalized,
    resolveActive,
  ])

  function handleOpenChange(next: boolean) {
    if (!next) {
      cancelActive('cancelled')
    }
  }

  function handleFooterSubmit() {
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

  const cancelLabel = active?.request.cancelLabel ?? 'Cancel'

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
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={footerBusy}
                onClick={() => cancelActive('cancelled')}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                disabled={!accessToken || footerBusy}
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
    </PlatformPeerDialogContext.Provider>
  )
}
