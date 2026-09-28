import type { CatalogEntityKind } from '@/features/sales/types/catalog.types'

export function buildCompanyMediaScope(companyId: string): string {
  return `webonone:company:${companyId}`
}

export function buildCatalogEntityGalleryFolderPath(
  _companyId: string,
  entityKind: CatalogEntityKind,
  entityId: string,
): string {
  return `/${entityKind}/${entityId}`
}
