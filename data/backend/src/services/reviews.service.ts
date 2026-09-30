import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { CreateReviewBody, UpdateReviewBody } from '../schemas/reviews.schema.js'

export type ReviewEntityKind = 'product' | 'service' | 'space'

export interface CatalogReviewRow {
  id: string
  company_id: string
  entity_kind: ReviewEntityKind
  entity_id: string
  user_id: string
  rating: number
  comment: string | null
  source_event_id: string | null
  source_occurrence_date: string | null
  created_at: Date
  updated_at: Date
}

export interface CatalogReviewDto {
  id: string
  companyId: string
  entityKind: ReviewEntityKind
  entityId: string
  userId: string
  rating: number
  comment: string | null
  sourceEventId: string | null
  sourceOccurrenceDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewSummaryDto {
  averageRating: number | null
  count: number
}

export interface PublicCatalogReviewDto {
  id: string
  rating: number
  comment: string | null
  createdAt: string
}

export interface PublicReviewListResult {
  summary: ReviewSummaryDto
  items: PublicCatalogReviewDto[]
  total: number
  page: number
  pageSize: number
}

function rowToPublicDto(row: CatalogReviewRow): PublicCatalogReviewDto {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
  }
}

function rowToDto(row: CatalogReviewRow): CatalogReviewDto {
  return {
    id: row.id,
    companyId: row.company_id,
    entityKind: row.entity_kind,
    entityId: row.entity_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    sourceEventId: row.source_event_id,
    sourceOccurrenceDate: row.source_occurrence_date,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function getMyReview(
  userId: string,
  companyId: string,
  entityKind: ReviewEntityKind,
  entityId: string,
): Promise<CatalogReviewDto | null> {
  const row = await db<CatalogReviewRow>('data_catalog_reviews')
    .where({
      user_id: userId,
      company_id: companyId,
      entity_kind: entityKind,
      entity_id: entityId,
    })
    .first()
  return row ? rowToDto(row) : null
}

export async function getReviewSummary(
  companyId: string,
  entityKind: ReviewEntityKind,
  entityId: string,
): Promise<ReviewSummaryDto> {
  const base = db('data_catalog_reviews').where({
    company_id: companyId,
    entity_kind: entityKind,
    entity_id: entityId,
  })

  const countResult = await base.clone().count<{ count: number }[]>('* as count')
  const count = Number(countResult[0]?.count ?? 0)

  const avgRow = await base.clone().avg<{ avg_rating: string | null }>('rating as avg_rating').first()
  const avgRaw = avgRow?.avg_rating
  const averageRating =
    count > 0 && avgRaw != null && avgRaw !== ''
      ? Math.round((Number(avgRaw) + Number.EPSILON) * 10) / 10
      : null

  return { averageRating, count }
}

export async function listPublicReviews(
  companyId: string,
  entityKind: ReviewEntityKind,
  entityId: string,
  page: number,
  pageSize: number,
): Promise<PublicReviewListResult> {
  const summary = await getReviewSummary(companyId, entityKind, entityId)
  const base = db<CatalogReviewRow>('data_catalog_reviews').where({
    company_id: companyId,
    entity_kind: entityKind,
    entity_id: entityId,
  })

  const countResult = await base.clone().count<{ count: number }[]>('* as count')
  const total = Number(countResult[0]?.count ?? 0)

  const rows = await base
    .clone()
    .orderBy('created_at', 'desc')
    .offset((page - 1) * pageSize)
    .limit(pageSize)

  return {
    summary,
    items: rows.map(rowToPublicDto),
    total,
    page,
    pageSize,
  }
}

export async function createReview(
  userId: string,
  body: CreateReviewBody,
): Promise<CatalogReviewDto> {
  const existing = await getMyReview(userId, body.companyId, body.entityKind, body.entityId)
  if (existing) {
    throw new Error('DUPLICATE_REVIEW')
  }

  const id = nanoid()
  const now = new Date()
  const comment =
    body.comment === undefined || body.comment === '' ? null : (body.comment ?? null)

  try {
    await db<CatalogReviewRow>('data_catalog_reviews').insert({
      id,
      company_id: body.companyId,
      entity_kind: body.entityKind,
      entity_id: body.entityId,
      user_id: userId,
      rating: body.rating,
      comment,
      source_event_id: body.sourceEventId ?? null,
      source_occurrence_date: body.sourceOccurrenceDate ?? null,
      created_at: now,
      updated_at: now,
    })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'ER_DUP_ENTRY') {
      throw new Error('DUPLICATE_REVIEW')
    }
    throw err
  }

  const row = await db<CatalogReviewRow>('data_catalog_reviews').where({ id }).first()
  if (!row) throw new Error('NOT_FOUND')
  return rowToDto(row)
}

export async function updateReview(
  userId: string,
  reviewId: string,
  body: UpdateReviewBody,
): Promise<CatalogReviewDto> {
  const row = await db<CatalogReviewRow>('data_catalog_reviews').where({ id: reviewId }).first()
  if (!row) throw new Error('NOT_FOUND')
  if (row.user_id !== userId) throw new Error('FORBIDDEN')

  const comment =
    body.comment === undefined ? row.comment : body.comment === '' ? null : body.comment

  await db<CatalogReviewRow>('data_catalog_reviews')
    .where({ id: reviewId })
    .update({
      rating: body.rating,
      comment,
      updated_at: new Date(),
    })

  const updated = await db<CatalogReviewRow>('data_catalog_reviews').where({ id: reviewId }).first()
  if (!updated) throw new Error('NOT_FOUND')
  return rowToDto(updated)
}
