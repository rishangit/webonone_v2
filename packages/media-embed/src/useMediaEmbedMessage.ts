import { useEffect } from 'react'
import {
  isMediaEmbedMessage,
  MEDIA_MESSAGE_TYPES,
  type MediaCancelMessage,
  type MediaDeletedMessage,
  type MediaEmbedMessage,
  type MediaSelectMessage,
  type MediaUploadedMessage,
} from './types'

export interface UseMediaEmbedMessageOptions {
  mediaOrigin: string
  onSelect?: (message: MediaSelectMessage) => void
  onUploaded?: (message: MediaUploadedMessage) => void
  onDeleted?: (message: MediaDeletedMessage) => void
  onCancel?: (message: MediaCancelMessage) => void
}

export function useMediaEmbedMessage(options: UseMediaEmbedMessageOptions): void {
  const { mediaOrigin, onSelect, onUploaded, onDeleted, onCancel } = options

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== mediaOrigin) {
        return
      }
      if (!isMediaEmbedMessage(event.data)) {
        return
      }

      const message = event.data as MediaEmbedMessage
      switch (message.type) {
        case MEDIA_MESSAGE_TYPES.SELECT:
          onSelect?.(message)
          break
        case MEDIA_MESSAGE_TYPES.UPLOADED:
          onUploaded?.(message)
          break
        case MEDIA_MESSAGE_TYPES.DELETED:
          onDeleted?.(message)
          break
        case MEDIA_MESSAGE_TYPES.CANCEL:
          onCancel?.(message)
          break
        default:
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [mediaOrigin, onCancel, onDeleted, onSelect, onUploaded])
}
