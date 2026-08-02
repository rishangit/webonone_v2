import type { CatalogGalleryImage } from '../types/companyCatalog.types'

/** First gallery image URL, or null when the gallery is empty/missing. */
export function firstGalleryImageUrl(
  images: CatalogGalleryImage[] | null | undefined,
): string | null {
  const url = images?.[0]?.url
  return typeof url === 'string' && url.trim() ? url : null
}
