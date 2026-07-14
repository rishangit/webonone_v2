import { forwardRef, useEffect, useRef } from 'react'
import { isPlatformReadyMessage, sendPlatformInit } from '@webonone/platform-embed'
import { buildMediaEmbedUrl } from './embedUrl'
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

      const origin = new URL(mediaOrigin).origin

      function deliverInit() {
        sendPlatformInit(iframe!, origin, accessToken!)
      }

      function handleLoad() {
        deliverInit()
        onLoad?.()
      }

      function onMessage(event: MessageEvent) {
        if (event.origin !== origin) {
          return
        }
        if (isPlatformReadyMessage(event.data)) {
          deliverInit()
        }
      }

      iframe.addEventListener('load', handleLoad)
      window.addEventListener('message', onMessage)

      if (iframe.contentDocument?.readyState === 'complete') {
        deliverInit()
      }

      return () => {
        iframe.removeEventListener('load', handleLoad)
        window.removeEventListener('message', onMessage)
      }
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
