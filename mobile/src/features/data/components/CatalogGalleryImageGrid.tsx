import { Pressable, View } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import {
  imagePreviewGalleryThumbClassName,
  ImagePreview,
  useThemedControlIconColor,
} from '@webonone/mobile-ui'

export function CatalogGalleryImageGrid({
  images,
  emptyAlt,
  imageAlt,
  canEdit,
  saving,
  removeAriaLabel,
  onRequestRemove,
}: {
  images: Array<{ mediaId: string; url: string }>
  emptyAlt: string
  imageAlt: string
  canEdit: boolean
  saving?: boolean
  removeAriaLabel: string
  onRequestRemove: (mediaId: string) => void
}) {
  const iconColor = useThemedControlIconColor()

  if (images.length === 0) {
    return (
      <View className="items-center py-4">
        <ImagePreview src={null} alt={emptyAlt} />
      </View>
    )
  }

  return (
    <View className="flex-row flex-wrap gap-3">
      {images.map((image) => (
        <View key={image.mediaId} className="relative">
          <ImagePreview src={image.url} alt={imageAlt} className={imagePreviewGalleryThumbClassName} />
          {canEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={removeAriaLabel}
              disabled={saving}
              onPress={() => onRequestRemove(image.mediaId)}
              className="absolute right-1 top-1 h-8 w-8 items-center justify-center rounded-md bg-card"
            >
              <Trash2 size={16} color={iconColor} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  )
}
