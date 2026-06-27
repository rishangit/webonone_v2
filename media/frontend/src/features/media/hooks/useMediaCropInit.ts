import { useEffect, useState } from 'react'
import {
  MEDIA_MESSAGE_TYPES,
  type CropAspectPreset,
} from '@webonone/media-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

export function useMediaCropInit(isEmbed: boolean, parentOrigin: string | null) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [defaultAspect, setDefaultAspect] = useState<CropAspectPreset>('1:1')
  const [aspectPresets, setAspectPresets] = useState<CropAspectPreset[] | undefined>()

  useEffect(() => {
    if (!isEmbed || !parentOrigin) {
      return
    }

    function handleCropInit(event: MessageEvent) {
      if (!isAllowedParentOrigin(event.origin)) {
        return
      }
      const data = event.data as {
        type?: string
        file?: File
        defaultAspect?: CropAspectPreset
        aspectPresets?: CropAspectPreset[]
      }
      if (data.type !== MEDIA_MESSAGE_TYPES.CROP_INIT || !(data.file instanceof File)) {
        return
      }
      setPendingFile(data.file)
      setDefaultAspect(data.defaultAspect ?? data.aspectPresets?.[0] ?? '1:1')
      setAspectPresets(data.aspectPresets)
    }

    window.addEventListener('message', handleCropInit)
    return () => window.removeEventListener('message', handleCropInit)
  }, [isEmbed, parentOrigin])

  function clearPending() {
    setPendingFile(null)
  }

  return { pendingFile, defaultAspect, aspectPresets, clearPending }
}
