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

export interface CatalogItem {
  id: string
  name: string
  description: string | null
  status: EntityStatus
  tags: TagSummary[]
  attributes: CatalogAttributeValue[]
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  counts: Record<string, { verified: number; pending: number }>
}
