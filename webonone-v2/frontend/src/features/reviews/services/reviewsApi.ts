import { getDataApiBaseUrl } from '@/features/data/utils/dataConfig'
import type {
  CatalogReviewEntityKind,
  CatalogReviewSubmitPayload,
} from '@webonone/ui-kit'

let getToken: () => string | null = () => null

export function setReviewsTokenGetter(getter: () => string | null) {
  getToken = getter
}

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
  rating: number
  comment: string | null
  createdAt: string
}

export type PublicReviewListResult = {
  summary: ReviewSummaryDto
  items: PublicCatalogReviewDto[]
  total: number
  page: number
  pageSize: number
}

async function dataFetch<T>(
  path: string,
  init?: { method?: string; body?: string },
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${getDataApiBaseUrl()}${path}`, {
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
    return dataFetch<{ review: CatalogReviewDto | null }>(`/reviews/me?${qs}`)
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
    return dataFetch<PublicReviewListResult>(`/reviews/public?${qs}`)
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
    return dataFetch<ReviewSummaryDto>(`/reviews/summary?${qs}`)
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
    return dataFetch<CatalogReviewDto>('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateReview(id: string, body: CatalogReviewSubmitPayload) {
    return dataFetch<CatalogReviewDto>(`/reviews/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
