import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type {
  CreateFeedbackBody,
  FeedbackStatus,
  FeedbackType,
  ListFeedbackQuery,
  UpdateFeedbackBody,
  UpdateFeedbackStatusBody,
} from '../schemas/feedbackSchemas.js'
import { countUnreadCommentsForReports } from './feedbackComments.service.js'
import { buildSupportFeedbackMediaScope } from '../schemas/feedbackSchemas.js'
import { fetchMediaItem } from './mediaClient.service.js'

function formatTicketNumber(sequence: number): string {
  return String(sequence).padStart(4, '0')
}

async function allocateNextTicketNumber(): Promise<string> {
  const maxRow = await db<FeedbackReportRow>('feedback_reports')
    .select('ticket_number')
    .orderBy('ticket_number', 'desc')
    .first()
  const maxTicket = maxRow?.ticket_number
  const next =
    typeof maxTicket === 'string' && /^\d{4}$/.test(maxTicket)
      ? Number.parseInt(maxTicket, 10) + 1
      : 1
  if (next > 9999) {
    throw new Error('TICKET_NUMBER_EXHAUSTED')
  }
  return formatTicketNumber(next)
}

export interface FeedbackReportRow {
  id: string
  ticket_number: string
  type: FeedbackType
  title: string
  description: string
  status: FeedbackStatus
  reporter_user_id: string
  reporter_email: string
  upload_session_id: string | null
  attachment_media_id: string | null
  attachment_url: string | null
  attachment_file_name: string | null
  attachment_mime_type: string | null
  created_at: Date
  updated_at: Date
}

export interface FeedbackReportDto {
  id: string
  ticketNumber: string
  type: FeedbackType
  title: string
  description: string
  status: FeedbackStatus
  reporterUserId: string
  reporterEmail: string
  uploadSessionId: string | null
  attachmentMediaId: string | null
  attachmentUrl: string | null
  attachmentFileName: string | null
  attachmentMimeType: string | null
  createdAt: string
  updatedAt: string
  unreadCommentCount?: number
}

function rowToDto(row: FeedbackReportRow): FeedbackReportDto {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    type: row.type,
    title: row.title,
    description: row.description,
    status: row.status,
    reporterUserId: row.reporter_user_id,
    reporterEmail: row.reporter_email,
    uploadSessionId: row.upload_session_id,
    attachmentMediaId: row.attachment_media_id,
    attachmentUrl: row.attachment_url,
    attachmentFileName: row.attachment_file_name,
    attachmentMimeType: row.attachment_mime_type,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function listFeedbackReports(query: ListFeedbackQuery, viewerUserId?: string) {
  const { page, pageSize, type, status, ticket, q } = query
  const base = db<FeedbackReportRow>('feedback_reports')

  if (type) {
    base.where({ type })
  }
  if (status) {
    base.where({ status })
  }
  if (ticket) {
    base.where({ ticket_number: ticket })
  }
  if (q) {
    const term = `%${q}%`
    base.where((builder) => {
      builder
        .where('title', 'like', term)
        .orWhere('description', 'like', term)
        .orWhere('reporter_email', 'like', term)
        .orWhere('ticket_number', 'like', term)
    })
  }

  const countResult = await base.clone().count<{ count: number }[]>('* as count')
  const total = Number(countResult[0]?.count ?? 0)

  const rows = await base
    .clone()
    .orderBy('created_at', 'desc')
    .offset((page - 1) * pageSize)
    .limit(pageSize)

  const items = rows.map(rowToDto)
  if (viewerUserId && items.length > 0) {
    const unread = await countUnreadCommentsForReports(
      items.map((item) => item.id),
      viewerUserId,
    )
    for (const item of items) {
      const count = unread[item.id]
      if (count) {
        item.unreadCommentCount = count
      }
    }
  }

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  }
}

async function validateAttachment(
  body: CreateFeedbackBody,
  reporterId: string,
  accessToken: string,
): Promise<void> {
  if (!body.attachment || !body.uploadSessionId) {
    return
  }

  const expectedScope = buildSupportFeedbackMediaScope(body.uploadSessionId)
  const media = await fetchMediaItem(body.attachment.mediaId, accessToken)
  if (!media) {
    throw new Error('INVALID_ATTACHMENT')
  }
  if (media.scope !== expectedScope) {
    throw new Error('INVALID_ATTACHMENT')
  }
  if (media.uploadedByUserId !== reporterId) {
    throw new Error('INVALID_ATTACHMENT')
  }
  if (!media.mimeType.startsWith('image/')) {
    throw new Error('INVALID_ATTACHMENT')
  }
  if (media.id !== body.attachment.mediaId) {
    throw new Error('INVALID_ATTACHMENT')
  }
}

export async function createFeedbackReport(
  body: CreateFeedbackBody,
  reporter: { id: string; email: string },
  accessToken: string,
): Promise<FeedbackReportDto> {
  await validateAttachment(body, reporter.id, accessToken)

  const id = nanoid()
  const ticketNumber = await allocateNextTicketNumber()
  const now = db.fn.now(3)

  await db('feedback_reports').insert({
    id,
    ticket_number: ticketNumber,
    type: body.type,
    title: body.title,
    description: body.description,
    status: 'todo',
    reporter_user_id: reporter.id,
    reporter_email: reporter.email,
    upload_session_id: body.uploadSessionId ?? null,
    attachment_media_id: body.attachment?.mediaId ?? null,
    attachment_url: body.attachment?.url ?? null,
    attachment_file_name: body.attachment?.fileName ?? null,
    attachment_mime_type: body.attachment?.mimeType ?? null,
    created_at: now,
    updated_at: now,
  })

  const row = await db<FeedbackReportRow>('feedback_reports').where({ id }).first()
  if (!row) {
    throw new Error('Failed to create feedback report')
  }
  return rowToDto(row)
}

export async function getFeedbackReportById(id: string): Promise<FeedbackReportDto> {
  const row = await db<FeedbackReportRow>('feedback_reports').where({ id }).first()
  if (!row) {
    throw new Error('NOT_FOUND')
  }
  return rowToDto(row)
}

export async function getFeedbackReportByTicketNumber(
  ticketNumber: string,
): Promise<FeedbackReportDto> {
  const row = await db<FeedbackReportRow>('feedback_reports')
    .where({ ticket_number: ticketNumber })
    .first()
  if (!row) {
    throw new Error('NOT_FOUND')
  }
  return rowToDto(row)
}

function canEditFeedbackReport(
  row: FeedbackReportRow,
  user: { id: string; platformRole: string },
): boolean {
  return user.platformRole === 'super_admin' || row.reporter_user_id === user.id
}

export async function updateFeedbackReport(
  id: string,
  body: UpdateFeedbackBody,
  user: { id: string; email: string; platformRole: string },
  accessToken: string,
): Promise<FeedbackReportDto> {
  const existing = await db<FeedbackReportRow>('feedback_reports').where({ id }).first()
  if (!existing) {
    throw new Error('NOT_FOUND')
  }
  if (!canEditFeedbackReport(existing, user)) {
    throw new Error('FORBIDDEN')
  }

  await validateAttachment(
    {
      type: body.type,
      title: body.title,
      description: body.description,
      uploadSessionId: body.uploadSessionId,
      attachment: body.attachment,
    },
    user.id,
    accessToken,
  )

  const patch: Record<string, unknown> = {
    type: body.type,
    title: body.title,
    description: body.description,
    updated_at: db.fn.now(3),
  }

  if (body.clearAttachment) {
    patch.upload_session_id = null
    patch.attachment_media_id = null
    patch.attachment_url = null
    patch.attachment_file_name = null
    patch.attachment_mime_type = null
  } else if (body.attachment && body.uploadSessionId) {
    patch.upload_session_id = body.uploadSessionId
    patch.attachment_media_id = body.attachment.mediaId
    patch.attachment_url = body.attachment.url
    patch.attachment_file_name = body.attachment.fileName
    patch.attachment_mime_type = body.attachment.mimeType
  }

  await db('feedback_reports').where({ id }).update(patch)

  return getFeedbackReportById(id)
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
