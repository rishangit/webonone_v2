import type {
  CatalogReviewEntityKind,
  CatalogReviewSubmitPayload,
} from '@webonone/mobile-ui'
import { env } from '@/shared/config/env'
import { secureStorage } from '@/shared/services/secureStorage'

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

async function webononeFetch<T>(
  path: string,
  init?: { method?: string; body?: string },
): Promise<T> {
  const token = await secureStorage.getAccessToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const base = env.webononeApiBaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}${path}`, {
    method: init?.method ?? 'GET',
    headers,
    body: init?.body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? 'Review request failed')
  }
  return data as T
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
    return webononeFetch<{ review: CatalogReviewDto | null }>(`/reviews/me?${qs}`)
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
    return webononeFetch<PublicReviewListResult>(`/reviews/public?${qs}`)
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
    return webononeFetch<ReviewSummaryDto>(`/reviews/summary?${qs}`)
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
    return webononeFetch<{ summaries: Record<string, ReviewSummaryDto> }>(
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
    return webononeFetch<CatalogReviewDto>('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateReview(id: string, body: CatalogReviewSubmitPayload) {
    return webononeFetch<CatalogReviewDto>(`/reviews/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
