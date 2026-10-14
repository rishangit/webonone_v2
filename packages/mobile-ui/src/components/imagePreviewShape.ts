import type { ImageStyle, ViewStyle } from 'react-native'

/** Matches web `ui-shape-image-flush` — list/card thumbs without a separate image border. */
export const imagePreviewFlushClassName = 'image-preview-flush'

/** Matches web `ui-shape-image` (classic theme `border-radius: var(--radius)`). */
export type ImagePreviewShape = 'image' | 'circle' | 'md' | 'sm'

const LIST_THUMB_HEIGHT_PATTERN = /\bh-(8|10|14|16|20|24|28)\b/

/** Overview / detail gallery heroes (product, service, company catalog). */
const GALLERY_HERO_HEIGHT_PATTERN = /\bh-(32|40|48|56|64)\b/

export const imagePreviewGalleryClassName = `${imagePreviewFlushClassName} h-48 w-full rounded-lg`

export const imagePreviewGalleryThumbClassName = `${imagePreviewFlushClassName} h-28 w-28 rounded-lg`

export const imagePreviewOverviewThumbClassName = `${imagePreviewFlushClassName} h-20 w-20 rounded-lg`

export function imagePreviewIsFlush(className?: string, flush?: boolean): boolean {
  if (flush) return true
  if (!className) return false
  if (className.includes(imagePreviewFlushClassName)) return true
  if (LIST_THUMB_HEIGHT_PATTERN.test(className)) return true
  if (GALLERY_HERO_HEIGHT_PATTERN.test(className)) return true
  if (/\bw-full\b/.test(className)) return true
  return false
}

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
