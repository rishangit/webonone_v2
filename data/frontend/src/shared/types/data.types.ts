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

export interface AttributeUnitSummary {
  id: string
  name: string
  symbol: string
}

export interface Attribute {
  id: string
  name: string
  description: string | null
  valueType: 'number' | 'text'
  unitId: string | null
  unit: AttributeUnitSummary | null
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

export interface CatalogAttributeValueEntry {
  id: string
  valueText: string | null
  valueNumber: number | null
  isDefault: boolean
}

export interface CatalogAttributeValue {
  attributeId: string
  name: string
  valueType: 'number' | 'text'
  unit: AttributeUnitSummary | null
  values: CatalogAttributeValueEntry[]
}

export type ServiceTimeMode = 'duration' | 'window'

export interface CatalogGalleryImage {
  mediaId: string
  url: string
}

export interface CatalogItem {
  id: string
  name: string
  description: string | null
  status: EntityStatus
  referenceCount: number
  tags: TagSummary[]
  attributes: CatalogAttributeValue[]
  galleryImages: CatalogGalleryImage[]
  createdAt: string
  updatedAt: string
  /** Services only */
  timeMode?: ServiceTimeMode
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

export interface ServiceSpaceLink {
  id: string
  name: string
  description: string | null
  status: EntityStatus
  sortOrder: number
}

export interface ProductVariantAttributeValue {
  attributeId: string
  attributeName: string
  attributeValueId: string
  valueText: string | null
  valueNumber: number | null
  valueType: 'number' | 'text'
  unitSymbol: string | null
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string
  isDefault: boolean
  values: ProductVariantAttributeValue[]
  createdAt: string
  updatedAt: string
}

export interface ProductVariantStock {
  id: string
  variantId: string
  quantity: number
  batchNumber: string
  costPrice: number
  sellPrice: number
  purchaseDate: string
  expiredDate: string | null
  supplierUserId: string
  supplierDisplayName: string
  supplierEmail: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  counts: Record<string, { verified: number; pending: number }>
}
