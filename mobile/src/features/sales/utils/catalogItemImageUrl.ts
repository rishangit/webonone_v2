import type { CatalogGalleryImage, HydratedCatalogItem } from '@/features/sales/types/catalog.types'

function firstGalleryImageUrl(images: CatalogGalleryImage[] | null | undefined): string | null {
  const url = images?.[0]?.url
  return typeof url === 'string' && url.trim() ? url : null
}

export function catalogItemImageUrl(item: HydratedCatalogItem): string | null {
  const fromDisplay = firstGalleryImageUrl(item.displayGalleryImages)
  if (fromDisplay) return fromDisplay
  const fromCompany = firstGalleryImageUrl(item.galleryImages)
  if (fromCompany) return fromCompany
  const payload = (item.hydrated ?? item.payload) as Record<string, unknown> | null
  const url = payload?.imageUrl
  return typeof url === 'string' && url.trim() ? url.trim() : null
}
