import { DATA_ENTITY_KEYS, DATA_ENTITY_LABELS, type DataEntityKey } from '@webonone/platform-nav'

export type CatalogEntityKind = DataEntityKey
export type CatalogBindingMode = 'linked' | 'forked' | 'custom'

export const CATALOG_ENTITY_KINDS = DATA_ENTITY_KEYS
export const CATALOG_ENTITY_LABELS = DATA_ENTITY_LABELS

export type CatalogPayload = Record<string, unknown>

export type CatalogGalleryImage = {
  mediaId: string
  url: string
}

export type WebPublishStatus = 'draft' | 'completed' | 'published'

export function resolveWebPublishStatus(
  status: WebPublishStatus | null | undefined,
): WebPublishStatus {
  if (status === 'completed' || status === 'published' || status === 'draft') return status
  return 'draft'
}

export type CompanyCatalogItem = {
  id: string
  companyId: string
  entityKind: CatalogEntityKind
  bindingMode: CatalogBindingMode
  libraryEntityId: string | null
  payload: CatalogPayload | null
  /** Columnar name for forked/custom (null when linked). */
  name?: string | null
  description?: string | null
  /** Company-owned gallery refs; null = inherit library gallery when linked. */
  galleryImages?: CatalogGalleryImage[] | null
  /** Design form template id (services only). */
  formTemplateId?: string | null
  /** Product column price, or the service/space price that applies right now. */
  listPrice?: number | null
  /** Original service/space price when a discount applies. */
  listPriceCompareAt?: number | null
  listDiscountPercent?: number | null
  /** Public website / marketplace visibility (products, services, spaces). */
  webPublishStatus?: WebPublishStatus
  createdAt: string
  updatedAt: string
}

/** Display model after optional Data library hydration. */
export type HydratedCatalogItem = CompanyCatalogItem & {
  displayName: string
  displayDescription: string | null
  /** Effective gallery for UI (library inherit or company override). */
  displayGalleryImages?: CatalogGalleryImage[]
  libraryUnavailable?: boolean
  hydrated?: CatalogPayload | null
}

export const CATALOG_ENTITY_SINGULAR_KEYS = {
  tags: 'tag',
  units: 'unit',
  attributes: 'attribute',
  products: 'product',
  services: 'service',
  spaces: 'space',
} as const satisfies Record<CatalogEntityKind, string>

export function singularLabel(kind: CatalogEntityKind): string {
  const label = CATALOG_ENTITY_LABELS[kind]
  return label.endsWith('s') ? label.slice(0, -1) : label
}

export const CATALOG_GALLERY_KINDS = ['products', 'services', 'spaces'] as const
export type CatalogGalleryKind = (typeof CATALOG_GALLERY_KINDS)[number]

export function isCatalogGalleryKind(kind: CatalogEntityKind): kind is CatalogGalleryKind {
  return (CATALOG_GALLERY_KINDS as readonly string[]).includes(kind)
}

export type CatalogSessionItem = {
  eventId: string
  occurrenceDate: string
  startTime: string
  endTime: string
  serviceName: string
  companyId: string
  spaceId: string | null
  spaceName: string | null
  scheduleChanged?: boolean
  scheduleChangeKind?: 'delayed' | 'early' | null
  originalStartTime?: string
  originalEndTime?: string
}

export type CatalogSessionTokenItem = {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  tokenNumber: number
  tokenLabel: string
  callOrder?: number
  userId: string
  userDisplayName: string
  userEmail: string | null
  userAvatarUrl: string | null
  createdAt: string
  updatedAt: string
  workflowProgress?: {
    steps: { id: string; label: string; kind: 'check_in' | 'space' | 'done' }[]
    currentIndex: number
    done: boolean
  }
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
