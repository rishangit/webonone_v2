import { useEffect, useState } from 'react'
import { Image, Pressable, View, type ImageStyle } from 'react-native'
import { Image as ImageIcon, Pencil } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { useThemeColors } from '../theme/ThemeProvider'
import {
  imagePreviewClipStyle,
  imagePreviewShapeClass,
  resolveImagePreviewShape,
  stripImagePreviewRadiusClasses,
  type ImagePreviewShape,
} from './imagePreviewShape'

export type ImagePreviewMode = 'view' | 'edit'

export type ImagePreviewProps = {
  src?: string | null
  alt: string
  mode?: ImagePreviewMode
  shape?: ImagePreviewShape
  onEdit?: () => void
  className?: string
}

function resolveImageUri(src?: string | null): string | null {
  const trimmed = src?.trim()
  return trimmed ? trimmed : null
}

/** ~40% of box height, capped at 40px — matches web ImagePreview. */
function resolveIconSize(className?: string): number {
  const heightMatch = className?.match(/\bh-(\d+)\b/)
  if (heightMatch) {
    const heightPx = Number(heightMatch[1]) * 4
    return Math.min(Math.round(heightPx * 0.4), 40)
  }
  return 40
}

function EditOverlay({ onEdit }: { onEdit: () => void }) {
  const colors = useThemeColors()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Edit image"
      className="absolute inset-0 items-center justify-center bg-black/35"
      onPress={onEdit}
    >
      <View className="h-10 w-10 items-center justify-center rounded-control bg-secondary shadow-md">
        <Pencil size={16} color={colors.text} strokeWidth={2} />
      </View>
    </Pressable>
  )
}

export function ImagePreview({
  src,
  alt,
  mode = 'view',
  shape,
  onEdit,
  className,
}: ImagePreviewProps) {
  const uri = resolveImageUri(src)
  const [failed, setFailed] = useState(false)
  const colors = useThemeColors()
  const showEditOverlay = mode === 'edit' && Boolean(onEdit)
  const resolvedShape = resolveImagePreviewShape(shape, className)
  const sizeClassName = stripImagePreviewRadiusClasses(className)
  const clipStyle = imagePreviewClipStyle(resolvedShape)
  const imageClipStyle: ImageStyle = {
    borderRadius: clipStyle.borderRadius,
  }

  useEffect(() => {
    setFailed(false)
  }, [uri])

  const containerClass = cn(
    'relative shrink-0 overflow-hidden border border-border bg-input',
    imagePreviewShapeClass(resolvedShape),
    sizeClassName || 'h-40 w-40',
  )
  const iconSize = resolveIconSize(sizeClassName || className)

  return (
    <View className={containerClass} style={clipStyle} accessibilityLabel={alt}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          accessibilityLabel={alt}
          className="h-full w-full"
          style={imageClipStyle}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View className="h-full w-full items-center justify-center bg-input">
          <ImageIcon size={iconSize} color={colors.textMuted} strokeWidth={1.75} />
        </View>
      )}
      {showEditOverlay && onEdit ? <EditOverlay onEdit={onEdit} /> : null}
    </View>
  )
}
