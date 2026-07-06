import { useEffect, useRef, useState } from 'react'
import { buildPlatformEmbedUrl, buildPlatformRedirectUri, sendPlatformInit } from './embedUrl'
import { isPlatformReadyMessage } from './types'
import type { BuildPlatformEmbedUrlOptions } from './types'

export type PlatformServiceFrameProps = {
  peerOrigin: string
  peerPath: string
  accessToken: string
  authCodeEndpoint: string
  parentOrigin?: string
  scope?: string
  searchParams?: Record<string, string>
  title: string
  className?: string
  onLoadingChange?: (loading: boolean) => void
  onError?: (message: string) => void
}

export function PlatformServiceFrame({
  peerOrigin,
  peerPath,
  accessToken,
  authCodeEndpoint,
  parentOrigin = typeof window !== 'undefined' ? window.location.origin : '',
  scope,
  searchParams,
  title,
  className,
  onLoadingChange,
  onError,
}: PlatformServiceFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadFrame() {
      onLoadingChange?.(true)
      setError(null)

      const embedOptions: BuildPlatformEmbedUrlOptions = {
        peerOrigin,
        path: peerPath,
        parentOrigin,
        scope,
        searchParams,
      }
      const targetUrl = buildPlatformEmbedUrl(embedOptions)
      const redirectUri = buildPlatformRedirectUri(peerOrigin, peerPath)

      try {
        const res = await fetch(authCodeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ redirectUri }),
        })

        const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string }
        if (!res.ok || !data.code) {
          throw new Error(data.message ?? 'Failed to create authorization code')
        }

        const url = new URL(targetUrl)
        url.searchParams.set('code', data.code)

        if (!cancelled) {
          setIframeSrc(url.toString())
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load service'
        if (!cancelled) {
          setError(message)
          onError?.(message)
          onLoadingChange?.(false)
        }
      }
    }

    void loadFrame()

    return () => {
      cancelled = true
    }
  }, [
    accessToken,
    authCodeEndpoint,
    onError,
    onLoadingChange,
    parentOrigin,
    peerOrigin,
    peerPath,
    scope,
    searchParams,
  ])

  useEffect(() => {
    if (!iframeSrc) {
      return
    }

    function onMessage(event: MessageEvent) {
      const peerOriginNormalized = new URL(peerOrigin).origin
      if (event.origin !== peerOriginNormalized) {
        return
      }

      if (!isPlatformReadyMessage(event.data)) {
        return
      }

      const iframe = iframeRef.current
      if (iframe) {
        sendPlatformInit(iframe, peerOriginNormalized, accessToken)
      }
      onLoadingChange?.(false)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [accessToken, iframeSrc, onLoadingChange, peerOrigin])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !iframeSrc) {
      return
    }

    function handleLoad() {
      const frame = iframeRef.current
      if (frame) {
        sendPlatformInit(frame, new URL(peerOrigin).origin, accessToken)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [accessToken, iframeSrc, peerOrigin])

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!iframeSrc) {
    return null
  }

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc}
      title={title}
      className={className ?? 'block h-full min-h-0 w-full border-0 bg-transparent'}
    />
  )
}
