export type CatalogKind = 'products' | 'services' | 'spaces'

export type ServiceTimeMode = 'duration' | 'window'

export type CatalogSearchItem = {
  id: string
  kind: CatalogKind
  name: string
  description: string | null
  companyId: string
  companyName: string
  companyImageUrl: string | null
  tags: Array<{ id: string; name: string; color?: string }>
  imageUrl: string | null
  distanceKm: number | null
  latitude: number | null
  longitude: number | null
  referenceCount: number
  listPrice: number | null
  listPriceCompareAt?: number | null
  listDiscountPercent?: number | null
  reviewSummary?: { averageRating: number | null; count: number }
  timeMode?: ServiceTimeMode | null
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

export type CatalogDetailItem = CatalogSearchItem & {
  galleryImages: Array<{ mediaId: string; url: string }>
}

export type PublicProductVariantAttributeValue = {
  attributeId: string
  attributeName: string
  attributeValueId: string
  valueText: string | null
  valueNumber: number | null
  valueType: 'number' | 'text'
  unitSymbol: string | null
}

export type PublicProductVariantOfferLine = {
  variantId: string
  name: string
  isDefault: boolean
  attributeValues: PublicProductVariantAttributeValue[]
  totalQuantity: number
  sellPrice: number | null
  compareAtSellPrice?: number | null
  discountPercent?: number | null
}

export type PublicProductVariantOffer = {
  listPrice: number | null
  libraryUnavailable: boolean
  variantCount: number
  lines: PublicProductVariantOfferLine[]
}

export type CatalogSearchResult = {
  items: CatalogSearchItem[]
  total: number
  page: number
  pageSize: number
}

export type NearbyCompanyGroup = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  distanceKm: number
  latitude: number
  longitude: number
  items: CatalogSearchItem[]
}

export type NearbyCatalogResult = {
  companies: NearbyCompanyGroup[]
}

export type CatalogPublicReviewItem = {
  id: string
  userId?: string
  rating: number
  comment: string | null
  createdAt: string
  reviewerDisplayName: string
  reviewerAvatarUrl: string | null
}

export type CatalogPublicReviewListResult = {
  summary: { averageRating: number | null; count: number }
  items: CatalogPublicReviewItem[]
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
