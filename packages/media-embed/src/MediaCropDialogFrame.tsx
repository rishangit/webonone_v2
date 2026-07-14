import { forwardRef, useEffect, useRef } from 'react'
import { sendPlatformInit } from '@webonone/platform-embed'
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

      function deliverInit() {
        sendPlatformInit(iframe!, new URL(mediaOrigin).origin, accessToken!)
        sendMediaCropInit(iframe!, mediaOrigin, {
          file: cropFile!,
          defaultAspect,
          aspectPresets,
        })
      }

      function handleLoad() {
        deliverInit()
      }

      iframe.addEventListener('load', handleLoad)
      if (iframe.contentDocument?.readyState === 'complete') {
        deliverInit()
      }

      return () => iframe.removeEventListener('load', handleLoad)
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
