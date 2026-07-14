import { useEffect, useMemo, useRef } from 'react'
import { buildPlatformEmbedUrl, sendPlatformInit } from './embedUrl'
import { isPlatformContentReadyMessage, isPlatformReadyMessage } from './types'
import type { BuildPlatformEmbedUrlOptions } from './types'

/** Fallback hide if an embedded app never reports content-ready (older build). */
const CONTENT_READY_FALLBACK_MS = 12000

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
  }, [accessToken, onLoadingChange, peerOriginNormalized])

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
