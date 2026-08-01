export type CatalogKind = 'products' | 'services' | 'spaces'

export type CatalogSearchItem = {
  id: string
  kind: CatalogKind
  name: string
  description: string | null
  companyId: string
  companyName: string
  tags: Array<{ id: string; name: string; color?: string }>
  distanceKm: number | null
  latitude: number | null
  longitude: number | null
}

export type CatalogDetailItem = CatalogSearchItem & {
  galleryImages: Array<{ mediaId: string; url: string }>
}

export type CatalogSearchResult = {
  items: CatalogSearchItem[]
  total: number
  page: number
  pageSize: number
}

export const CATALOG_KINDS: CatalogKind[] = ['products', 'services', 'spaces']

export function isCatalogKind(value: string): value is CatalogKind {
  return (CATALOG_KINDS as readonly string[]).includes(value)
}
