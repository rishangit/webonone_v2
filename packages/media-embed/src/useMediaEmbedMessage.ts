import { useEffect } from 'react'
import {
  isMediaEmbedMessage,
  MEDIA_MESSAGE_TYPES,
  type MediaCancelMessage,
  type MediaCropRequestMessage,
  type MediaDeletedMessage,
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
  onCropRequest?: (message: MediaCropRequestMessage) => void
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
    onCropRequest,
  } = options

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== mediaOrigin) {
        return
      }
      if (!isMediaEmbedMessage(event.data)) {
        return
      }

      const message = event.data
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
        case MEDIA_MESSAGE_TYPES.CROP_REQUEST:
          onCropRequest?.(message)
          break
        default:
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [mediaOrigin, onCancel, onCropRequest, onDeleted, onSelect, onSelectionChange, onUploaded, onViewerChanged])
}
