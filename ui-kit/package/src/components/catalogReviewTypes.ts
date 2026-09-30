export type CatalogReviewEntityKind = 'product' | 'service' | 'space'

export type CatalogReviewTarget = {
  companyId: string
  entityKind: CatalogReviewEntityKind
  entityId: string
  displayName: string
  imageUrl?: string | null
}

export type CatalogReviewExisting = {
  id: string
  rating: number
  comment: string | null
}

export type CatalogReviewSubmitPayload = {
  rating: number
  comment: string | null
}
