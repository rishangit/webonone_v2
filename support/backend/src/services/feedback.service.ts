import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type {
  CreateFeedbackBody,
  FeedbackStatus,
  FeedbackType,
  ListFeedbackQuery,
  UpdateFeedbackStatusBody,
} from '../schemas/feedbackSchemas.js'

export interface FeedbackReportRow {
  id: string
  type: FeedbackType
  title: string
  description: string
  status: FeedbackStatus
  reporter_user_id: string
  reporter_email: string
  created_at: Date
  updated_at: Date
}

export interface FeedbackReportDto {
  id: string
  type: FeedbackType
  title: string
  description: string
  status: FeedbackStatus
  reporterUserId: string
  reporterEmail: string
  createdAt: string
  updatedAt: string
}

function rowToDto(row: FeedbackReportRow): FeedbackReportDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    status: row.status,
    reporterUserId: row.reporter_user_id,
    reporterEmail: row.reporter_email,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function listFeedbackReports(query: ListFeedbackQuery) {
  const { page, pageSize, type, status, q } = query
  const base = db<FeedbackReportRow>('feedback_reports')

  if (type) {
    base.where({ type })
  }
  if (status) {
    base.where({ status })
  }
  if (q) {
    const term = `%${q}%`
    base.where((builder) => {
      builder
        .where('title', 'like', term)
        .orWhere('description', 'like', term)
        .orWhere('reporter_email', 'like', term)
    })
  }

  const countResult = await base.clone().count<{ count: number }[]>('* as count')
  const total = Number(countResult[0]?.count ?? 0)

  const rows = await base
    .clone()
    .orderBy('created_at', 'desc')
    .offset((page - 1) * pageSize)
    .limit(pageSize)

  return {
    items: rows.map(rowToDto),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  }
}

export async function createFeedbackReport(
  body: CreateFeedbackBody,
  reporter: { id: string; email: string },
): Promise<FeedbackReportDto> {
  const id = nanoid()
  const now = db.fn.now(3)

  await db('feedback_reports').insert({
    id,
    type: body.type,
    title: body.title,
    description: body.description,
    status: 'todo',
    reporter_user_id: reporter.id,
    reporter_email: reporter.email,
    created_at: now,
    updated_at: now,
  })

  const row = await db<FeedbackReportRow>('feedback_reports').where({ id }).first()
  if (!row) {
    throw new Error('Failed to create feedback report')
  }
  return rowToDto(row)
}

export async function updateFeedbackStatus(
  id: string,
  body: UpdateFeedbackStatusBody,
): Promise<FeedbackReportDto> {
  const existing = await db<FeedbackReportRow>('feedback_reports').where({ id }).first()
  if (!existing) {
    throw new Error('NOT_FOUND')
  }

  await db('feedback_reports')
    .where({ id })
    .update({
      status: body.status,
      updated_at: db.fn.now(3),
    })

  const row = await db<FeedbackReportRow>('feedback_reports').where({ id }).first()
  if (!row) {
    throw new Error('NOT_FOUND')
  }
  return rowToDto(row)
}
