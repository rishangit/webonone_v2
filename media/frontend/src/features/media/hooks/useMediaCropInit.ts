import { useEffect, useState } from 'react'
import {
  MEDIA_MESSAGE_TYPES,
  type CropAspectPreset,
} from '@webonone/media-embed'
import { PLATFORM_MESSAGE_TYPES } from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

function toCropFile(value: unknown): File | null {
  if (value instanceof File) {
    return value
  }
  // Structured-clone edge cases: Blob without File prototype
  if (value instanceof Blob) {
    return new File([value], 'image', { type: value.type || 'image/jpeg' })
  }
  return null
}

export function useMediaCropInit(isEmbed: boolean, parentOrigin: string | null) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [defaultAspect, setDefaultAspect] = useState<CropAspectPreset>('1:1')
  const [aspectPresets, setAspectPresets] = useState<CropAspectPreset[] | undefined>()

  useEffect(() => {
    if (!isEmbed || !parentOrigin) {
      return
    }

    function handleCropInit(event: MessageEvent) {
      if (event.origin !== parentOrigin || !isAllowedParentOrigin(event.origin)) {
        return
      }
      const data = event.data as {
        type?: string
        file?: unknown
        defaultAspect?: CropAspectPreset
        aspectPresets?: CropAspectPreset[]
      }
      if (data.type !== MEDIA_MESSAGE_TYPES.CROP_INIT) {
        return
      }
      const file = toCropFile(data.file)
      if (!file) {
        return
      }
      setPendingFile(file)
      setDefaultAspect(data.defaultAspect ?? data.aspectPresets?.[0] ?? '1:1')
      setAspectPresets(data.aspectPresets)
    }

    window.addEventListener('message', handleCropInit)
    // Listener is ready — ask parent to (re)send CROP_INIT. Auth READY often
    // fires in an earlier effect before this listener exists.
    window.parent.postMessage({ type: PLATFORM_MESSAGE_TYPES.READY }, parentOrigin)

    return () => window.removeEventListener('message', handleCropInit)
  }, [isEmbed, parentOrigin])

  function clearPending() {
    setPendingFile(null)
  }

  return { pendingFile, defaultAspect, aspectPresets, clearPending }
}
