import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { EmailHistoryRow, EmailQueueRow, QueueStatus } from '../models/db.js'
import { sendMail } from './mail.service.js'
import { renderEmail, resolveTemplate, validateTemplatePayload } from './template.service.js'

const RETRY_DELAYS_MS = [60_000, 300_000, 900_000]

export interface EnqueueInput {
  templateSlug: string
  toEmail: string
  payload: Record<string, string>
  companyId?: string | null
  priority?: number
  maxRetries?: number
}

export interface QueueItemDto {
  id: string
  templateSlug: string
  toEmail: string
  payload: Record<string, string>
  companyId: string | null
  status: QueueStatus
  retryCount: number
  maxRetries: number
  priority: number
  scheduledAt: string
  processedAt: string | null
  lastError: string | null
  createdAt: string
}

export interface HistoryItemDto {
  id: string
  queueId: string | null
  status: 'sent' | 'failed'
  providerMessageId: string | null
  sentAt: string
  recipient: string
  templateSlug: string
  companyId: string | null
  errorMessage: string | null
}

function parsePayload(row: EmailQueueRow): Record<string, string> {
  if (typeof row.payload_json === 'string') {
    try {
      return JSON.parse(row.payload_json) as Record<string, string>
    } catch {
      return {}
    }
  }
  return row.payload_json as Record<string, string>
}

function queueRowToDto(row: EmailQueueRow): QueueItemDto {
  return {
    id: row.id,
    templateSlug: row.template_slug,
    toEmail: row.to_email,
    payload: parsePayload(row),
    companyId: row.company_id,
    status: row.status,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    priority: row.priority,
    scheduledAt: row.scheduled_at.toISOString(),
    processedAt: row.processed_at?.toISOString() ?? null,
    lastError: row.last_error,
    createdAt: row.created_at.toISOString(),
  }
}

function historyRowToDto(row: EmailHistoryRow): HistoryItemDto {
  return {
    id: row.id,
    queueId: row.queue_id,
    status: row.status,
    providerMessageId: row.provider_message_id,
    sentAt: row.sent_at.toISOString(),
    recipient: row.recipient,
    templateSlug: row.template_slug,
    companyId: row.company_id,
    errorMessage: row.error_message,
  }
}

export async function enqueue(input: EnqueueInput): Promise<{ queueId: string; status: 'queued' }> {
  const template = await resolveTemplate(input.templateSlug, input.companyId)
  if (!template) {
    throw new Error(`Template not found: ${input.templateSlug}`)
  }

  await validateTemplatePayload(template, input.payload, input.companyId)

  const id = nanoid()
  await db('email_queue').insert({
    id,
    template_slug: input.templateSlug,
    to_email: input.toEmail,
    payload_json: JSON.stringify(input.payload),
    company_id: input.companyId ?? null,
    status: 'pending',
    retry_count: 0,
    max_retries: input.maxRetries ?? 3,
    priority: input.priority ?? 0,
    scheduled_at: db.fn.now(3),
    processed_at: null,
    last_error: null,
    created_at: db.fn.now(3),
  })

  return { queueId: id, status: 'queued' }
}

export async function getNextQueueItem(): Promise<EmailQueueRow | null> {
  return db.transaction(async (trx) => {
    const row = await trx<EmailQueueRow>('email_queue')
      .where('status', 'pending')
      .andWhere('scheduled_at', '<=', trx.fn.now(3))
      .orderBy('priority', 'desc')
      .orderBy('scheduled_at', 'asc')
      .forUpdate()
      .skipLocked()
      .first()

    if (!row) return null

    await trx('email_queue').where({ id: row.id }).update({
      status: 'processing',
      processed_at: trx.fn.now(3),
    })

    return { ...row, status: 'processing' as const }
  })
}

export async function processQueueItem(row: EmailQueueRow): Promise<void> {
  const payload = parsePayload(row)

  try {
    const template = await resolveTemplate(row.template_slug, row.company_id)
    if (!template) {
      throw new Error(`Template not found: ${row.template_slug}`)
    }

    const rendered = await renderEmail(template, payload, row.company_id)
    const result = await sendMail({
      to: row.to_email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    })

    await db.transaction(async (trx) => {
      await trx('email_queue').where({ id: row.id }).update({
        status: 'sent',
        processed_at: trx.fn.now(3),
        last_error: null,
      })

      await trx('email_history').insert({
        id: nanoid(),
        queue_id: row.id,
        status: 'sent',
        provider_message_id: result.messageId,
        sent_at: trx.fn.now(3),
        recipient: row.to_email,
        template_slug: row.template_slug,
        company_id: row.company_id,
        error_message: null,
        created_at: trx.fn.now(3),
      })
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    const nextRetryCount = row.retry_count + 1

    if (nextRetryCount < row.max_retries) {
      const delayMs = RETRY_DELAYS_MS[Math.min(nextRetryCount - 1, RETRY_DELAYS_MS.length - 1)]
      const scheduledAt = new Date(Date.now() + delayMs)

      await db('email_queue').where({ id: row.id }).update({
        status: 'pending',
        retry_count: nextRetryCount,
        scheduled_at: scheduledAt,
        last_error: message,
        processed_at: db.fn.now(3),
      })
      return
    }

    await db.transaction(async (trx) => {
      await trx('email_queue').where({ id: row.id }).update({
        status: 'failed',
        retry_count: nextRetryCount,
        last_error: message,
        processed_at: trx.fn.now(3),
      })

      await trx('email_history').insert({
        id: nanoid(),
        queue_id: row.id,
        status: 'failed',
        provider_message_id: null,
        sent_at: trx.fn.now(3),
        recipient: row.to_email,
        template_slug: row.template_slug,
        company_id: row.company_id,
        error_message: message,
        created_at: trx.fn.now(3),
      })
    })
  }
}

export async function listQueue(filters: {
  status?: QueueStatus
  companyId?: string
  page: number
  pageSize: number
}) {
  const query = db<EmailQueueRow>('email_queue').orderBy('created_at', 'desc')
  if (filters.status) query.where({ status: filters.status })
  if (filters.companyId) query.where({ company_id: filters.companyId })

  const offset = (filters.page - 1) * filters.pageSize
  const [rows, countResult] = await Promise.all([
    query.clone().limit(filters.pageSize).offset(offset),
    query.clone().count<{ count: number }[]>('* as count'),
  ])

  const total = Number(countResult[0]?.count ?? 0)
  return {
    items: rows.map(queueRowToDto),
    page: filters.page,
    pageSize: filters.pageSize,
    total,
  }
}

export async function retryQueueItem(id: string): Promise<QueueItemDto> {
  const row = await db<EmailQueueRow>('email_queue').where({ id }).first()
  if (!row) {
    throw new Error('Queue item not found')
  }
  if (row.status !== 'failed') {
    throw new Error('Only failed items can be retried')
  }

  await db('email_queue').where({ id }).update({
    status: 'pending',
    retry_count: 0,
    scheduled_at: db.fn.now(3),
    last_error: null,
    processed_at: null,
  })

  const updated = await db<EmailQueueRow>('email_queue').where({ id }).first()
  return queueRowToDto(updated!)
}

export async function listHistory(filters: {
  status?: 'sent' | 'failed'
  templateSlug?: string
  search?: string
  companyId?: string
  from?: string
  to?: string
  page: number
  pageSize: number
}) {
  const query = db<EmailHistoryRow>('email_history').orderBy('sent_at', 'desc')
  if (filters.status) query.where({ status: filters.status })
  if (filters.templateSlug) query.where({ template_slug: filters.templateSlug })
  if (filters.search) {
    const pattern = `%${filters.search}%`
    query.where(function applyHistorySearch() {
      this.where('recipient', 'like', pattern)
        .orWhere('template_slug', 'like', pattern)
        .orWhereIn('template_slug', function matchingTemplateNames() {
          this.select('slug').from('email_templates').where('name', 'like', pattern)
        })
    })
  }
  if (filters.companyId) query.where({ company_id: filters.companyId })
  if (filters.from) query.where('sent_at', '>=', new Date(filters.from))
  if (filters.to) query.where('sent_at', '<=', new Date(filters.to))

  const offset = (filters.page - 1) * filters.pageSize
  const [rows, countResult] = await Promise.all([
    query.clone().limit(filters.pageSize).offset(offset),
    query.clone().count<{ count: number }[]>('* as count'),
  ])

  const total = Number(countResult[0]?.count ?? 0)
  return {
    items: rows.map(historyRowToDto),
    page: filters.page,
    pageSize: filters.pageSize,
    total,
  }
}

export async function getDashboardStats(companyId?: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const baseQueue = db<EmailQueueRow>('email_queue')
  const baseHistory = db<EmailHistoryRow>('email_history').where('sent_at', '>=', since)

  if (companyId) {
    baseQueue.where({ company_id: companyId })
    baseHistory.where({ company_id: companyId })
  }

  const [pendingCount, failedCount, sentCount, recentHistory] = await Promise.all([
    baseQueue.clone().where({ status: 'pending' }).count<{ count: number }[]>('* as count'),
    baseQueue.clone().where({ status: 'failed' }).where('created_at', '>=', since).count<{ count: number }[]>('* as count'),
    baseHistory.clone().where({ status: 'sent' }).count<{ count: number }[]>('* as count'),
    db<EmailHistoryRow>('email_history')
      .modify((qb) => {
        if (companyId) qb.where({ company_id: companyId })
      })
      .orderBy('sent_at', 'desc')
      .limit(10),
  ])

  return {
    pendingCount: Number(pendingCount[0]?.count ?? 0),
    failedCount24h: Number(failedCount[0]?.count ?? 0),
    sentCount24h: Number(sentCount[0]?.count ?? 0),
    recentActivity: recentHistory.map(historyRowToDto),
  }
}
