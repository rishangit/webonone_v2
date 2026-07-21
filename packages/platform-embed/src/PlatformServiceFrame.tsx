import { useEffect, useMemo, useRef } from 'react'
import {
  buildPlatformEmbedUrl,
  sendPlatformInit,
  sendPlatformMediaDialogCancel,
  sendPlatformMediaDialogResult,
  sendPlatformPeerDialogCancel,
  sendPlatformPeerDialogResult,
} from './embedUrl'
import {
  isPlatformContentReadyMessage,
  isPlatformMediaDialogRequestMessage,
  isPlatformPeerDialogRequestMessage,
  isPlatformReadyMessage,
} from './types'
import type {
  BuildPlatformEmbedUrlOptions,
  PlatformMediaDialogItem,
  PlatformMediaDialogRequestMessage,
  PlatformPeerDialogRequestMessage,
} from './types'

/** Fallback hide if an embedded app never reports content-ready (older build). */
const CONTENT_READY_FALLBACK_MS = 12000

export type PlatformMediaDialogResponder = {
  resolve: (items: PlatformMediaDialogItem[]) => void
  cancel: (reason?: string) => void
}

export type PlatformPeerDialogResponder = {
  resolve: (payload?: unknown) => void
  cancel: (reason?: string) => void
}

export type PlatformServiceFrameProps = {
  peerOrigin: string
  peerPath: string
  accessToken: string
  parentOrigin?: string
  scope?: string
  searchParams?: Record<string, string>
  title: string
  className?: string
  onLoadingChange?: (loading: boolean) => void
  onMediaDialogRequest?: (
    request: PlatformMediaDialogRequestMessage,
    responder: PlatformMediaDialogResponder,
  ) => void
  onPeerDialogRequest?: (
    request: PlatformPeerDialogRequestMessage,
    responder: PlatformPeerDialogResponder,
    peerOrigin: string,
  ) => void
}

export function PlatformServiceFrame({
  peerOrigin,
  peerPath,
  accessToken,
  parentOrigin = typeof window !== 'undefined' ? window.location.origin : '',
  scope,
  searchParams,
  title,
  className,
  onLoadingChange,
  onMediaDialogRequest,
  onPeerDialogRequest,
}: PlatformServiceFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const peerOriginNormalized = useMemo(() => new URL(peerOrigin).origin, [peerOrigin])

  const iframeSrc = useMemo(() => {
    const embedOptions: BuildPlatformEmbedUrlOptions = {
      peerOrigin,
      path: peerPath,
      parentOrigin,
      scope,
      searchParams,
    }
    return buildPlatformEmbedUrl(embedOptions)
  }, [parentOrigin, peerOrigin, peerPath, scope, searchParams])

  useEffect(() => {
    onLoadingChange?.(true)

    // Safety net: hide the overlay even if the peer never emits content-ready.
    const fallback = window.setTimeout(() => {
      onLoadingChange?.(false)
    }, CONTENT_READY_FALLBACK_MS)

    return () => window.clearTimeout(fallback)
  }, [iframeSrc, onLoadingChange])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== peerOriginNormalized) {
        return
      }

      if (isPlatformMediaDialogRequestMessage(event.data)) {
        const iframe = iframeRef.current
        if (!iframe || event.source !== iframe.contentWindow) {
          return
        }

        const targetWindow = iframe.contentWindow
        const request = event.data
        const responder: PlatformMediaDialogResponder = {
          resolve: (items) =>
            sendPlatformMediaDialogResult(
              targetWindow,
              peerOriginNormalized,
              request.requestId,
              items,
            ),
          cancel: (reason) =>
            sendPlatformMediaDialogCancel(
              targetWindow,
              peerOriginNormalized,
              request.requestId,
              reason,
            ),
        }

        if (!onMediaDialogRequest) {
          responder.cancel('unsupported')
          return
        }

        onMediaDialogRequest(request, responder)
        return
      }

      if (isPlatformPeerDialogRequestMessage(event.data)) {
        const iframe = iframeRef.current
        if (!iframe || event.source !== iframe.contentWindow) {
          return
        }

        const targetWindow = iframe.contentWindow
        const request = event.data
        const responder: PlatformPeerDialogResponder = {
          resolve: (payload) =>
            sendPlatformPeerDialogResult(
              targetWindow,
              peerOriginNormalized,
              request.requestId,
              payload,
            ),
          cancel: (reason) =>
            sendPlatformPeerDialogCancel(
              targetWindow,
              peerOriginNormalized,
              request.requestId,
              reason,
            ),
        }

        if (!onPeerDialogRequest) {
          responder.cancel('unsupported')
          return
        }

        onPeerDialogRequest(request, responder, peerOriginNormalized)
        return
      }

      // Send auth as soon as the embedded app is ready to receive it.
      if (isPlatformReadyMessage(event.data)) {
        const iframe = iframeRef.current
        if (iframe) {
          sendPlatformInit(iframe, peerOriginNormalized, accessToken)
        }
        return
      }

      // Only hide the overlay once the embedded first page is fully loaded.
      if (isPlatformContentReadyMessage(event.data)) {
        onLoadingChange?.(false)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [
    accessToken,
    onLoadingChange,
    onMediaDialogRequest,
    onPeerDialogRequest,
    peerOriginNormalized,
  ])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) {
      return
    }

    function handleLoad() {
      const frame = iframeRef.current
      if (frame) {
        sendPlatformInit(frame, peerOriginNormalized, accessToken)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [accessToken, iframeSrc, peerOriginNormalized])

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc}
      title={title}
      className={className ?? 'block h-full min-h-0 w-full border-0 bg-transparent'}
    />
  )
}
