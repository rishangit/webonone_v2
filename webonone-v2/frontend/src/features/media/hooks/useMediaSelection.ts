import { useCallback, useState } from 'react'
import { useMediaEmbedMessage, type MediaItemDto, type MediaSelectMessage } from '@webonone/media-embed'
import { getMediaOrigin } from '../utils/mediaConfig'

export function useMediaSelection(onComplete?: (items: MediaItemDto[]) => void) {
  const [selectedItems, setSelectedItems] = useState<MediaItemDto[]>([])

  const handleSelect = useCallback(
    (message: MediaSelectMessage) => {
      setSelectedItems(message.items)
      onComplete?.(message.items)
    },
    [onComplete],
  )

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onSelect: handleSelect,
  })

  return { selectedItems, setSelectedItems }
}
