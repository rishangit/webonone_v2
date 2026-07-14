import { forwardRef, useEffect, useRef } from 'react'
import { isPlatformReadyMessage, sendPlatformInit } from '@webonone/platform-embed'

export interface MediaEmbedFrameProps<T extends object> {
  isOpen: boolean
  accessToken: string | null
  mediaOrigin: string
  urlOptions: T
  buildSrc: (options: T) => string
  onLoad?: () => void
  title?: string
  className?: string
}

export function createMediaEmbedFrame<T extends object>(defaultTitle: string) {
  return forwardRef<HTMLIFrameElement, MediaEmbedFrameProps<T>>(function MediaEmbedFrame(
    {
      isOpen,
      accessToken,
      mediaOrigin,
      urlOptions,
      buildSrc,
      onLoad,
      title = defaultTitle,
      className,
    },
    ref,
  ) {
    const internalRef = useRef<HTMLIFrameElement>(null)
    const src = buildSrc(urlOptions)

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
  })
}
