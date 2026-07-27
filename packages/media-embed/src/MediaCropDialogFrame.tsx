import { forwardRef, useEffect, useRef } from 'react'
import { isPlatformReadyMessage, sendPlatformInit } from '@webonone/platform-embed'
import { buildMediaCropDialogUrl, sendMediaCropInit } from './embedUrl'
import type { BuildMediaCropDialogUrlOptions, CropAspectPreset } from './types'

export interface MediaCropDialogFrameProps extends BuildMediaCropDialogUrlOptions {
  isOpen: boolean
  accessToken: string | null
  mediaOrigin: string
  cropFile: File | null
  defaultAspect?: CropAspectPreset
  aspectPresets?: CropAspectPreset[]
  className?: string
}

export const MediaCropDialogFrame = forwardRef<HTMLIFrameElement, MediaCropDialogFrameProps>(
  function MediaCropDialogFrame(
    {
      isOpen,
      accessToken,
      mediaOrigin,
      cropFile,
      defaultAspect,
      aspectPresets,
      className,
      ...urlOptions
    },
    ref,
  ) {
    const internalRef = useRef<HTMLIFrameElement>(null)
    const src = buildMediaCropDialogUrl(urlOptions)

    useEffect(() => {
      if (!isOpen || !accessToken || !cropFile) {
        return
      }

      const iframe =
        (ref && typeof ref !== 'function' ? ref.current : null) ?? internalRef.current
      if (!iframe) {
        return
      }

      const origin = new URL(mediaOrigin).origin
      const retryTimers: number[] = []

      function deliverInit() {
        sendPlatformInit(iframe!, origin, accessToken!)
        sendMediaCropInit(iframe!, origin, {
          file: cropFile!,
          defaultAspect,
          aspectPresets,
        })
      }

      /** Child may attach its CROP_INIT listener in a later effect after READY. */
      function deliverInitWithRetries() {
        deliverInit()
        for (const delayMs of [0, 50, 150]) {
          retryTimers.push(window.setTimeout(deliverInit, delayMs))
        }
      }

      function handleLoad() {
        deliverInitWithRetries()
      }

      function onMessage(event: MessageEvent) {
        if (event.origin !== origin) {
          return
        }
        if (isPlatformReadyMessage(event.data)) {
          deliverInitWithRetries()
        }
      }

      iframe.addEventListener('load', handleLoad)
      window.addEventListener('message', onMessage)

      if (iframe.contentDocument?.readyState === 'complete') {
        deliverInitWithRetries()
      }

      return () => {
        iframe.removeEventListener('load', handleLoad)
        window.removeEventListener('message', onMessage)
        for (const timer of retryTimers) {
          window.clearTimeout(timer)
        }
      }
    }, [accessToken, aspectPresets, cropFile, defaultAspect, isOpen, mediaOrigin, ref, src])

    if (!isOpen) {
      return null
    }

    return (
      <iframe
        ref={ref ?? internalRef}
        src={src}
        title="Crop image"
        className={className ?? 'h-full min-h-0 w-full border-0 bg-transparent'}
        allow="clipboard-read; clipboard-write"
      />
    )
  },
)
