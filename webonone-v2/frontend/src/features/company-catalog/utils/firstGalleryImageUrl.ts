import type { CatalogGalleryImage, HydratedCatalogItem } from '../types/companyCatalog.types'

/** First gallery image URL, or null when the gallery is empty/missing. */
export function firstGalleryImageUrl(
  images: CatalogGalleryImage[] | null | undefined,
): string | null {
  const url = images?.[0]?.url
  return typeof url === 'string' && url.trim() ? url : null
}

/** Best preview URL for a hydrated company catalog row (gallery inherit or payload image). */
export function catalogItemImageUrl(item: HydratedCatalogItem): string | null {
  const fromDisplay = firstGalleryImageUrl(item.displayGalleryImages)
  if (fromDisplay) return fromDisplay
  const fromCompany = firstGalleryImageUrl(item.galleryImages)
  if (fromCompany) return fromCompany
  const payload = (item.hydrated ?? item.payload) as Record<string, unknown> | null
  const url = payload?.imageUrl
  return typeof url === 'string' && url.trim() ? url.trim() : null
}
