export type CatalogKind = 'products' | 'services' | 'spaces'

export type ServiceTimeMode = 'duration' | 'window'

export type CatalogSearchItem = {
  id: string
  kind: CatalogKind
  name: string
  description: string | null
  companyId: string
  companyName: string
  tags: Array<{ id: string; name: string; color?: string }>
  imageUrl: string | null
  distanceKm: number | null
  latitude: number | null
  longitude: number | null
}

export type CatalogDetailItem = CatalogSearchItem & {
  galleryImages: Array<{ mediaId: string; url: string }>
  timeMode?: ServiceTimeMode | null
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

export type CatalogSearchResult = {
  items: CatalogSearchItem[]
  total: number
  page: number
  pageSize: number
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
}

export type SessionTokenItem = {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  tokenNumber: number
  tokenLabel: string
  userId: string
  userDisplayName: string
  userEmail: string | null
  createdAt: string
  updatedAt: string
  workflowProgress?: {
    steps: { id: string; label: string; kind: 'check_in' | 'space' | 'done' }[]
    currentIndex: number
    done: boolean
  }
}

export const CATALOG_KINDS: CatalogKind[] = ['products', 'services', 'spaces']

export function isCatalogKind(value: string): value is CatalogKind {
  return (CATALOG_KINDS as readonly string[]).includes(value)
}
