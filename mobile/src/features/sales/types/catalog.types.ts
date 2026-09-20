import type { DataEntityKey } from '@webonone/platform-nav'

export type CatalogEntityKind = Extract<DataEntityKey, 'products' | 'services' | 'spaces'>

export type CatalogGalleryImage = {
  mediaId: string
  url: string
}

export type CompanyCatalogItem = {
  id: string
  companyId: string
  entityKind: CatalogEntityKind
  bindingMode: 'linked' | 'forked' | 'custom'
  libraryEntityId: string | null
  payload: Record<string, unknown> | null
  name?: string | null
  description?: string | null
  galleryImages?: CatalogGalleryImage[] | null
  listPrice?: number | null
  createdAt: string
  updatedAt: string
}

export type HydratedCatalogItem = CompanyCatalogItem & {
  displayName: string
  displayDescription: string | null
  displayGalleryImages?: CatalogGalleryImage[]
  libraryUnavailable?: boolean
  hydrated?: Record<string, unknown> | null
}
