import { useEffect } from 'react'
import { isMediaParentMessage, MEDIA_MESSAGE_TYPES } from '@webonone/media-embed'

export function useMediaParentCommands(
  isEmbed: boolean,
  parentOrigin: string | null,
  onConfirm: () => void,
) {
  useEffect(() => {
    if (!isEmbed || !parentOrigin) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) {
        return
      }
      if (!isMediaParentMessage(event.data)) {
        return
      }
      if (event.data.type === MEDIA_MESSAGE_TYPES.CONFIRM) {
        onConfirm()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isEmbed, onConfirm, parentOrigin])
}
