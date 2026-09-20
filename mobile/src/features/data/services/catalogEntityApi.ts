import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { CatalogGalleryImage, CatalogGalleryKind, CatalogItem } from '@/shared/types/data.types'

export function updateCatalogGallery(
  kind: CatalogGalleryKind,
  id: string,
  galleryImages: CatalogGalleryImage[],
): Promise<CatalogItem> {
  if (kind === 'products') return dataAdminApi.updateProductGallery(id, galleryImages)
  if (kind === 'services') return dataAdminApi.updateServiceGallery(id, galleryImages)
  return dataAdminApi.updateSpaceGallery(id, galleryImages)
}

export function replaceCatalogAttributes(
  kind: CatalogGalleryKind,
  id: string,
  attributeIds: string[],
): Promise<CatalogItem> {
  if (kind === 'products') return dataAdminApi.replaceProductAttributes(id, attributeIds)
  if (kind === 'services') return dataAdminApi.replaceServiceAttributes(id, attributeIds)
  return dataAdminApi.replaceSpaceAttributes(id, attributeIds)
}
