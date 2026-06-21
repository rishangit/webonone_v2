import { useEffect, useRef } from 'react'
import { buildMediaEmbedUrl, sendMediaInit } from './embedUrl'
import type { BuildMediaEmbedUrlOptions } from './types'

export interface MediaPickerFrameProps extends BuildMediaEmbedUrlOptions {
  isOpen: boolean
  accessToken: string | null
  mediaOrigin: string
  onLoad?: () => void
  title?: string
  className?: string
}

export function MediaPickerFrame({
  isOpen,
  accessToken,
  mediaOrigin,
  onLoad,
  title = 'Media picker',
  className,
  ...urlOptions
}: MediaPickerFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const src = buildMediaEmbedUrl(urlOptions)

  useEffect(() => {
    if (!isOpen || !accessToken || !iframeRef.current) {
      return
    }

    const iframe = iframeRef.current
    function handleLoad() {
      sendMediaInit(iframe, mediaOrigin, accessToken!)
      onLoad?.()
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [accessToken, isOpen, mediaOrigin, onLoad, src])

  if (!isOpen) {
    return null
  }

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      className={className ?? 'h-full w-full border-0'}
      allow="clipboard-read; clipboard-write"
    />
  )
}
