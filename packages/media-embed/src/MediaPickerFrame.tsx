import { forwardRef, useEffect, useRef } from 'react'
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

export const MediaPickerFrame = forwardRef<HTMLIFrameElement, MediaPickerFrameProps>(
  function MediaPickerFrame(
    {
      isOpen,
      accessToken,
      mediaOrigin,
      onLoad,
      title = 'Media picker',
      className,
      ...urlOptions
    },
    ref,
  ) {
    const internalRef = useRef<HTMLIFrameElement>(null)
    const src = buildMediaEmbedUrl(urlOptions)

    useEffect(() => {
      if (!isOpen || !accessToken) {
        return
      }

      const iframe = (ref && typeof ref !== 'function' ? ref.current : null) ?? internalRef.current
      if (!iframe) {
        return
      }

      function handleLoad() {
        sendMediaInit(iframe!, mediaOrigin, accessToken!)
        onLoad?.()
      }

      iframe.addEventListener('load', handleLoad)
      return () => iframe.removeEventListener('load', handleLoad)
    }, [accessToken, isOpen, mediaOrigin, onLoad, ref, src])

    if (!isOpen) {
      return null
    }

    return (
      <iframe
        ref={ref ?? internalRef}
        src={src}
        title={title}
        className={className ?? 'h-full min-h-0 w-full border-0 bg-transparent'}
        allow="clipboard-read; clipboard-write"
      />
    )
  },
)
