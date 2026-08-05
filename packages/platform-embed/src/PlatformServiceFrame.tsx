import { useEffect, useMemo, useRef, useState } from 'react'
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
  isPlatformNavigateMessage,
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

/** Clear stale soft-nav skip if the shell URL did not change (allowlist reject / no-op). */
const CLIENT_NAV_SKIP_CLEAR_MS = 100

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
  /** Peer requested shell SPA navigation (relative path starting with `/`). */
  onPeerNavigate?: (path: string) => void
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
  onPeerNavigate,
}: PlatformServiceFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const peerOriginNormalized = useMemo(() => new URL(peerOrigin).origin, [peerOrigin])
  /** When true, the next `iframeSrc` change is shell URL sync only — do not reload. */
  const skipNextSrcCommitRef = useRef(false)
  const skipClearTimerRef = useRef<number | null>(null)

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

  const [frameSrc, setFrameSrc] = useState(iframeSrc)

  useEffect(() => {
    if (skipNextSrcCommitRef.current) {
      skipNextSrcCommitRef.current = false
      if (skipClearTimerRef.current != null) {
        window.clearTimeout(skipClearTimerRef.current)
        skipClearTimerRef.current = null
      }
      return
    }
    setFrameSrc((prev) => (prev === iframeSrc ? prev : iframeSrc))
  }, [iframeSrc])

  useEffect(() => {
    onLoadingChange?.(true)

    // Safety net: hide the overlay even if the peer never emits content-ready.
    const fallback = window.setTimeout(() => {
      onLoadingChange?.(false)
    }, CONTENT_READY_FALLBACK_MS)

    return () => window.clearTimeout(fallback)
  }, [frameSrc, onLoadingChange])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== peerOriginNormalized) {
        return
      }

      if (isPlatformNavigateMessage(event.data)) {
        const iframe = iframeRef.current
        if (!iframe || event.source !== iframe.contentWindow) {
          return
        }
        if (event.data.clientNavigated) {
          skipNextSrcCommitRef.current = true
          if (skipClearTimerRef.current != null) {
            window.clearTimeout(skipClearTimerRef.current)
          }
          // If the shell ignores the path (allowlist) or URL is unchanged, clear the skip.
          skipClearTimerRef.current = window.setTimeout(() => {
            skipNextSrcCommitRef.current = false
            skipClearTimerRef.current = null
          }, CLIENT_NAV_SKIP_CLEAR_MS)
        }
        onPeerNavigate?.(event.data.path)
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
    onPeerNavigate,
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
  }, [accessToken, frameSrc, peerOriginNormalized])

  useEffect(() => {
    return () => {
      if (skipClearTimerRef.current != null) {
        window.clearTimeout(skipClearTimerRef.current)
      }
    }
  }, [])

  return (
    <iframe
      ref={iframeRef}
      src={frameSrc}
      title={title}
      className={className ?? 'block h-full min-h-0 w-full border-0 bg-transparent'}
    />
  )
}
