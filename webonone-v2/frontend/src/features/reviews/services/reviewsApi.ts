import { apiClient } from '@/shared/services/apiClient'
import type {
  CatalogReviewEntityKind,
  CatalogReviewSubmitPayload,
} from '@webonone/ui-kit'

export type CatalogReviewDto = {
  id: string
  companyId: string
  entityKind: CatalogReviewEntityKind
  entityId: string
  userId: string
  rating: number
  comment: string | null
  sourceEventId: string | null
  sourceOccurrenceDate: string | null
  createdAt: string
  updatedAt: string
}

export type ReviewSummaryDto = {
  averageRating: number | null
  count: number
}

export type PublicCatalogReviewDto = {
  id: string
  userId: string
  rating: number
  comment: string | null
  createdAt: string
  reviewerDisplayName: string
  reviewerAvatarUrl: string | null
}

export type PublicReviewListResult = {
  summary: ReviewSummaryDto
  items: PublicCatalogReviewDto[]
  total: number
  page: number
  pageSize: number
}

export const reviewsApi = {
  getMyReview(params: {
    companyId: string
    entityKind: CatalogReviewEntityKind
    entityId: string
  }) {
    const qs = new URLSearchParams({
      companyId: params.companyId,
      entityKind: params.entityKind,
      entityId: params.entityId,
    })
    return apiClient<{ review: CatalogReviewDto | null }>(`/reviews/me?${qs}`)
  },

  listPublic(params: {
    companyId: string
    entityKind: CatalogReviewEntityKind
    entityId: string
    page?: number
    pageSize?: number
  }) {
    const qs = new URLSearchParams({
      companyId: params.companyId,
      entityKind: params.entityKind,
      entityId: params.entityId,
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 12),
    })
    return apiClient<PublicReviewListResult>(`/reviews/public?${qs}`)
  },

  getSummary(params: {
    companyId: string
    entityKind: CatalogReviewEntityKind
    entityId: string
  }) {
    const qs = new URLSearchParams({
      companyId: params.companyId,
      entityKind: params.entityKind,
      entityId: params.entityId,
    })
    return apiClient<ReviewSummaryDto>(`/reviews/summary?${qs}`)
  },

  getSummariesBatch(params: {
    companyId: string
    entityKind: CatalogReviewEntityKind
    entityIds: string[]
  }) {
    const qs = new URLSearchParams({
      companyId: params.companyId,
      entityKind: params.entityKind,
      entityIds: params.entityIds.join(','),
    })
    return apiClient<{ summaries: Record<string, ReviewSummaryDto> }>(
      `/reviews/summaries/batch?${qs}`,
    )
  },

  createReview(body: {
    companyId: string
    entityKind: CatalogReviewEntityKind
    entityId: string
    rating: number
    comment: string | null
    sourceEventId?: string | null
    sourceOccurrenceDate?: string | null
  }) {
    return apiClient<CatalogReviewDto>('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateReview(id: string, body: CatalogReviewSubmitPayload) {
    return apiClient<CatalogReviewDto>(`/reviews/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
