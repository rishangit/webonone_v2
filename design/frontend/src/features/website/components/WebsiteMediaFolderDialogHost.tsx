import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  buildPlatformEmbedUrl,
  isPlatformPeerDialogBusyMessage,
  isPlatformPeerDialogCancelMessage,
  isPlatformPeerDialogCompleteMessage,
  isPlatformPeerDialogRequestMessage,
  isPlatformReadyMessage,
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformInit,
  sendPlatformPeerDialogCancel,
  sendPlatformPeerDialogResult,
  sendPlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
  type PlatformPeerDialogRequestMessage,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { getMediaOrigin } from '../utils/mediaConfig'
import { withAppliedUserTheme } from '../utils/mediaEmbedTheme'

const FOLDER_DIALOG_PATH = '/embed/dialogs/folders/create'

interface FolderDialogRequest {
  source: Window
  origin: string
  request: PlatformPeerDialogRequestMessage
}

interface WebsiteMediaFolderDialogHostProps {
  selectorRef: RefObject<HTMLIFrameElement | null>
}

/**
 * New folder is requested by the media iframe. This page hosts the dialog, or
 * forwards it to the WebOnOne shell when Design itself is embedded.
 */
export function WebsiteMediaFolderDialogHost({ selectorRef }: WebsiteMediaFolderDialogHostProps) {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const shellParent = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const [request, setRequest] = useState<FolderDialogRequest | null>(null)
  const [openKey, setOpenKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [submitLabel, setSubmitLabel] = useState('OK')
  const dialogRef = useRef<HTMLIFrameElement>(null)
  const requestRef = useRef<FolderDialogRequest | null>(null)
  requestRef.current = request

  function replyCancel(current: FolderDialogRequest, reason = 'cancelled') {
    sendPlatformPeerDialogCancel(current.source, current.origin, current.request.requestId, reason)
  }

  function closeRequest(reason?: string) {
    const current = requestRef.current
    if (!current) return
    replyCancel(current, reason)
    setRequest(null)
    setBusy(false)
  }

  useRequestPlatformPeerDialog({
    parentOrigin: shellParent,
    open: Boolean(shellParent && request),
    openKey,
    path: request?.request.path ?? FOLDER_DIALOG_PATH,
    title: request?.request.title ?? 'New folder',
    description: request?.request.description,
    submitLabel: request?.request.submitLabel ?? 'OK',
    cancelLabel: request?.request.cancelLabel ?? 'Cancel',
    sizeWidth: request?.request.sizeWidth ?? 'small',
    sizeHeight: request?.request.sizeHeight ?? 'auto',
    bodyOrigin: getMediaOrigin(),
    onResult: (payload) => {
      const current = requestRef.current
      if (!current) return
      sendPlatformPeerDialogResult(
        current.source,
        current.origin,
        current.request.requestId,
        payload,
      )
      setRequest(null)
      setBusy(false)
    },
    onCancel: (reason) => closeRequest(reason),
  })

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      let mediaOrigin = ''
      try {
        mediaOrigin = new URL(getMediaOrigin()).origin
      } catch {
        return
      }
      if (event.origin !== mediaOrigin) return

      const selectorWindow = selectorRef.current?.contentWindow
      if (
        selectorWindow &&
        event.source === selectorWindow &&
        isPlatformPeerDialogRequestMessage(event.data)
      ) {
        if (!event.data.path.startsWith(FOLDER_DIALOG_PATH)) {
          sendPlatformPeerDialogCancel(
            selectorWindow,
            event.origin,
            event.data.requestId,
            'unsupported',
          )
          return
        }
        const previous = requestRef.current
        if (previous && previous.request.requestId !== event.data.requestId) {
          replyCancel(previous, 'replaced')
        }
        setBusy(false)
        setSubmitLabel(
          typeof event.data.submitLabel === 'string' ? event.data.submitLabel : 'OK',
        )
        setRequest({
          source: selectorWindow,
          origin: event.origin,
          request: event.data,
        })
        setOpenKey((key) => key + 1)
        return
      }

      if (shellParent) return
      const dialogWindow = dialogRef.current?.contentWindow
      const current = requestRef.current
      if (!dialogWindow || event.source !== dialogWindow || !current) return

      if (isPlatformReadyMessage(event.data)) {
        const iframe = dialogRef.current
        if (iframe && accessToken) {
          sendPlatformInit(iframe, mediaOrigin, accessToken)
        }
        return
      }

      if (event.data && typeof event.data === 'object' && 'requestId' in event.data) {
        const requestId = (event.data as { requestId?: unknown }).requestId
        if (requestId !== current.request.requestId) return
      }

      if (isPlatformPeerDialogCompleteMessage(event.data)) {
        sendPlatformPeerDialogResult(
          current.source,
          current.origin,
          current.request.requestId,
          event.data.payload,
        )
        setRequest(null)
        setBusy(false)
        return
      }

      if (isPlatformPeerDialogCancelMessage(event.data)) {
        replyCancel(current, event.data.reason)
        setRequest(null)
        setBusy(false)
        return
      }

      if (isPlatformPeerDialogBusyMessage(event.data)) {
        setBusy(event.data.busy)
        if (event.data.submitLabel) setSubmitLabel(event.data.submitLabel)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [accessToken, selectorRef, shellParent])

  const iframeSrc = useMemo(() => {
    if (!request || shellParent) return null
    return withAppliedUserTheme(
      buildPlatformEmbedUrl({
        peerOrigin: getMediaOrigin(),
        path: request.request.path,
        parentOrigin: window.location.origin,
        scope: 'peer-dialog',
        searchParams: {
          [PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID]: request.request.requestId,
        },
      }),
    )
  }, [request, shellParent])

  if (shellParent || !request || !iframeSrc) return null

  const cancelLabel = request.request.cancelLabel ?? 'Cancel'

  return (
    <CustomDialog
      open
      onOpenChange={(next) => {
        if (!next) closeRequest('cancelled')
      }}
      title={request.request.title}
      description={request.request.description}
      sizeWidth={request.request.sizeWidth}
      sizeHeight={request.request.sizeHeight}
      noContentPadding
      disableContentScroll
      nestedDismissGuard={busy}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            disabled={busy}
            onClick={() => closeRequest('cancelled')}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="h-10 px-4"
            disabled={busy || !accessToken}
            onClick={() => {
              const iframe = dialogRef.current
              if (!iframe) return
              sendPlatformPeerDialogSubmit(iframe.contentWindow, getMediaOrigin(), request.request.requestId)
            }}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <iframe
        key={request.request.requestId}
        ref={dialogRef}
        src={iframeSrc}
        title={request.request.title}
        className="block h-52 w-full border-0 bg-transparent"
      />
    </CustomDialog>
  )
}
