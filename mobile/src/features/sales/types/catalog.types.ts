import type { DataEntityKey } from '@webonone/platform-nav'

export type CatalogEntityKind = Extract<DataEntityKey, 'products' | 'services' | 'spaces'>
export type CatalogBindingMode = 'linked' | 'forked' | 'custom'
export type CatalogPayload = Record<string, unknown>

export type CatalogGalleryImage = {
  mediaId: string
  url: string
}

export type CatalogGalleryKind = CatalogEntityKind

export function isCatalogGalleryKind(kind: CatalogEntityKind): boolean {
  return kind === 'products' || kind === 'services' || kind === 'spaces'
}

export type CompanyCatalogItem = {
  id: string
  companyId: string
  entityKind: CatalogEntityKind
  bindingMode: CatalogBindingMode
  libraryEntityId: string | null
  payload: CatalogPayload | null
  name?: string | null
  description?: string | null
  galleryImages?: CatalogGalleryImage[] | null
  formTemplateId?: string | null
  listPrice?: number | null
  createdAt: string
  updatedAt: string
}

export type HydratedCatalogItem = CompanyCatalogItem & {
  displayName: string
  displayDescription: string | null
  displayGalleryImages?: CatalogGalleryImage[]
  libraryUnavailable?: boolean
  hydrated?: CatalogPayload | null
}

export type ServiceWorkflowStaff = {
  id: string
  displayName: string
  avatarUrl?: string | null
}

export type ServiceWorkflowForm = {
  id: string
  name?: string
}

export type ServiceWorkflowKind = 'check_in' | 'space'

export type ServiceWorkflowItem = {
  id: string
  kind: ServiceWorkflowKind
  orderNumber: number
  space: { id: string; name: string } | null
  staff: ServiceWorkflowStaff[]
  forms: ServiceWorkflowForm[]
  sessionQueue: boolean
  addItemsEnabled: boolean
  addItemsFromLibraryEnabled: boolean
}
