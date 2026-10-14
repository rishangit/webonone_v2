import { nanoid } from 'nanoid'
import {
  fetchUserContactsByIds,
  type IdentityUserContact,
} from '../clients/identityUserContactClient.js'
import { db } from '../models/db.js'
import type { CreateReviewBody, UpdateReviewBody } from '../schemas/reviews.schema.js'

export type ReviewEntityKind = 'product' | 'service' | 'space'

const TABLE = 'company_catalog_reviews'

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

function displayNameFromEmail(email: string | null | undefined): string | null {
  const local = email?.split('@')[0]?.trim()
  return local || null
}

function resolvePublicReviewer(contact?: IdentityUserContact): {
  displayName: string
  avatarUrl: string | null
} {
  const displayName =
    contact?.displayName?.trim() || displayNameFromEmail(contact?.email) || 'Customer'
  return {
    displayName,
    avatarUrl: contact?.avatarUrl ?? null,
  }
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
  userId: string
  rating: number
  comment: string | null
  createdAt: string
  reviewerDisplayName: string
  reviewerAvatarUrl: string | null
}

export interface PublicReviewListResult {
  summary: ReviewSummaryDto
  items: PublicCatalogReviewDto[]
  total: number
  page: number
  pageSize: number
}

function rowToPublicDto(
  row: CatalogReviewRow,
  reviewer: { displayName: string; avatarUrl: string | null },
): PublicCatalogReviewDto {
  return {
    id: row.id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
    reviewerDisplayName: reviewer.displayName,
    reviewerAvatarUrl: reviewer.avatarUrl,
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
  const row = await db<CatalogReviewRow>(TABLE)
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
  const base = db(TABLE).where({
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

export async function getReviewSummariesBatch(
  companyId: string,
  entityKind: ReviewEntityKind,
  entityIds: string[],
): Promise<Record<string, ReviewSummaryDto>> {
  const unique = [...new Set(entityIds.filter((id) => id.length === 21))]
  const result: Record<string, ReviewSummaryDto> = {}
  if (unique.length === 0) return result

  const rows = (await db(TABLE)
    .where({ company_id: companyId, entity_kind: entityKind })
    .whereIn('entity_id', unique)
    .groupBy('entity_id')
    .select('entity_id')
    .avg('rating as avg_rating')
    .count('* as count')) as Array<{
    entity_id: string
    avg_rating: string | null
    count: string | number
  }>

  for (const row of rows) {
    const count = Number(row.count ?? 0)
    const avgRaw = row.avg_rating
    const averageRating =
      count > 0 && avgRaw != null && avgRaw !== ''
        ? Math.round((Number(avgRaw) + Number.EPSILON) * 10) / 10
        : null
    result[row.entity_id] = { averageRating, count }
  }

  for (const id of unique) {
    if (!result[id]) {
      result[id] = { averageRating: null, count: 0 }
    }
  }

  return result
}

export async function listPublicReviews(
  companyId: string,
  entityKind: ReviewEntityKind,
  entityId: string,
  page: number,
  pageSize: number,
): Promise<PublicReviewListResult> {
  const summary = await getReviewSummary(companyId, entityKind, entityId)
  const base = db<CatalogReviewRow>(TABLE).where({
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

  const contacts = await fetchUserContactsByIds(rows.map((row) => row.user_id))

  return {
    summary,
    items: rows.map((row) =>
      rowToPublicDto(row, resolvePublicReviewer(contacts.get(row.user_id))),
    ),
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
    await db<CatalogReviewRow>(TABLE).insert({
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
    if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW') {
      throw new Error('COMPANY_NOT_FOUND')
    }
    throw err
  }

  const row = await db<CatalogReviewRow>(TABLE).where({ id }).first()
  if (!row) throw new Error('NOT_FOUND')
  return rowToDto(row)
}

export async function updateReview(
  userId: string,
  reviewId: string,
  body: UpdateReviewBody,
): Promise<CatalogReviewDto> {
  const row = await db<CatalogReviewRow>(TABLE).where({ id: reviewId }).first()
  if (!row) throw new Error('NOT_FOUND')
  if (row.user_id !== userId) throw new Error('FORBIDDEN')

  const comment =
    body.comment === undefined ? row.comment : body.comment === '' ? null : body.comment

  await db<CatalogReviewRow>(TABLE)
    .where({ id: reviewId })
    .update({
      rating: body.rating,
      comment,
      updated_at: new Date(),
    })

  const updated = await db<CatalogReviewRow>(TABLE).where({ id: reviewId }).first()
  if (!updated) throw new Error('NOT_FOUND')
  return rowToDto(updated)
}
