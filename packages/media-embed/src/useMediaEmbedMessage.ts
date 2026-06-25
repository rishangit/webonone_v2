import { useEffect } from 'react'
import {
  isMediaEmbedMessage,
  MEDIA_MESSAGE_TYPES,
  type MediaCancelMessage,
  type MediaDeletedMessage,
  type MediaEmbedMessage,
  type MediaSelectionChangeMessage,
  type MediaSelectMessage,
  type MediaUploadedMessage,
  type MediaViewerChangedMessage,
} from './types'

export interface UseMediaEmbedMessageOptions {
  mediaOrigin: string
  onSelect?: (message: MediaSelectMessage) => void
  onSelectionChange?: (message: MediaSelectionChangeMessage) => void
  onUploaded?: (message: MediaUploadedMessage) => void
  onDeleted?: (message: MediaDeletedMessage) => void
  onCancel?: (message: MediaCancelMessage) => void
  onViewerChanged?: (message: MediaViewerChangedMessage) => void
}

export function useMediaEmbedMessage(options: UseMediaEmbedMessageOptions): void {
  const {
    mediaOrigin,
    onSelect,
    onSelectionChange,
    onUploaded,
    onDeleted,
    onCancel,
    onViewerChanged,
  } = options

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
        case MEDIA_MESSAGE_TYPES.SELECTION_CHANGE:
          onSelectionChange?.(message)
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
        case MEDIA_MESSAGE_TYPES.VIEWER_CHANGED:
          onViewerChanged?.(message)
          break
        default:
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [mediaOrigin, onCancel, onDeleted, onSelect, onSelectionChange, onUploaded, onViewerChanged])
}
