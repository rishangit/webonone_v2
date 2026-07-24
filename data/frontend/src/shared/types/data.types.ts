export type EntityStatus = 'verified' | 'pending'

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface Tag {
  id: string
  name: string
  description: string | null
  color: string
  status: EntityStatus
  referenceCount: number
  createdAt: string
  updatedAt: string
}

export interface Unit {
  id: string
  name: string
  description: string | null
  symbol: string
  baseUnitId: string | null
  isBase: boolean
  status: EntityStatus
  referenceCount: number
  createdAt: string
  updatedAt: string
}

export interface Attribute {
  id: string
  name: string
  description: string | null
  valueType: 'number' | 'text'
  unitId: string | null
  status: EntityStatus
  referenceCount: number
  createdAt: string
  updatedAt: string
}

export interface TagSummary {
  id: string
  name: string
  color: string
}

export interface CatalogAttributeValue {
  attributeId: string
  name: string
  valueText: string | null
  valueNumber: number | null
}

export type ServiceTimeMode = 'duration' | 'window'

export interface CatalogItem {
  id: string
  name: string
  description: string | null
  status: EntityStatus
  referenceCount: number
  tags: TagSummary[]
  attributes: CatalogAttributeValue[]
  createdAt: string
  updatedAt: string
  /** Services only */
  timeMode?: ServiceTimeMode
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

export interface DashboardStats {
  counts: Record<string, { verified: number; pending: number }>
}
