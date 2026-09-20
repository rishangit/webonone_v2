import type { ImageStyle, ViewStyle } from 'react-native'

/** Matches web `ui-shape-image` (classic theme `border-radius: var(--radius)`). */
export type ImagePreviewShape = 'image' | 'circle' | 'md' | 'sm'

const SHAPE_CLASS: Record<ImagePreviewShape, string> = {
  image: 'rounded-lg',
  circle: 'rounded-full',
  md: 'rounded-md',
  sm: 'rounded-sm',
}

/** Pixel radii aligned with mobile `tailwind.config.js` borderRadius tokens. */
const SHAPE_RADIUS_PX: Record<ImagePreviewShape, number> = {
  image: 20,
  circle: 9999,
  md: 14,
  sm: 4,
}

export function resolveImagePreviewShape(
  shape?: ImagePreviewShape,
  className?: string,
): ImagePreviewShape {
  if (shape) {
    return shape
  }
  if (className?.includes('rounded-full')) {
    return 'circle'
  }
  if (className?.includes('rounded-md')) {
    return 'md'
  }
  if (className?.includes('rounded-sm')) {
    return 'sm'
  }
  if (className?.includes('rounded-lg')) {
    return 'image'
  }
  return 'image'
}

export function imagePreviewShapeClass(shape: ImagePreviewShape): string {
  return SHAPE_CLASS[shape]
}

export function imagePreviewClipStyle(shape: ImagePreviewShape): ViewStyle & ImageStyle {
  return {
    borderRadius: SHAPE_RADIUS_PX[shape],
    overflow: 'hidden',
  }
}

export function stripImagePreviewRadiusClasses(className?: string): string {
  if (!className) {
    return ''
  }
  return className.replace(/\brounded-\S+/g, '').replace(/\s+/g, ' ').trim()
}
