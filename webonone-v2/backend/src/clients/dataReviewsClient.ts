import { env } from '../config/env.js'

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

function apiV1Base(): string {
  if (!env.dataApiBaseUrl) {
    throw Object.assign(new Error('DATA_API_BASE_URL not configured'), { statusCode: 503 })
  }
  const root = env.dataApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
  return `${root}/api/v1`
}

export async function listPublicReviews(params: {
  companyId: string
  entityKind: 'product' | 'service' | 'space'
  entityId: string
  page?: number
  pageSize?: number
}): Promise<PublicReviewListResult> {
  const qs = new URLSearchParams({
    companyId: params.companyId,
    entityKind: params.entityKind,
    entityId: params.entityId,
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 24),
  })
  const res = await fetch(`${apiV1Base()}/reviews/public?${qs}`)
  const data = (await res.json().catch(() => ({}))) as { message?: string } & Partial<PublicReviewListResult>
  if (!res.ok) {
    throw Object.assign(new Error(data.message ?? 'Failed to load reviews'), {
      statusCode: res.status >= 500 ? 502 : res.status,
    })
  }
  return data as PublicReviewListResult
}
