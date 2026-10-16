import type { CatalogGalleryImage, HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'

/** When leaving linked mode, snapshot the effective gallery if the company row still inherits. */
export function catalogForkGallerySnapshot(
  detail: HydratedCatalogItem,
): CatalogGalleryImage[] | undefined {
  if (detail.galleryImages != null) return undefined
  const images = detail.displayGalleryImages ?? []
  return images.length > 0 ? images : undefined
}
