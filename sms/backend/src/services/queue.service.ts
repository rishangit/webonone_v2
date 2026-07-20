import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { DeviceScope, QueueStatus, SmsDeviceRow, SmsHistoryRow, SmsQueueRow } from '../models/db.js'
import { renderBody, resolveTemplate, validateTemplatePayload } from './template.service.js'

const RETRY_DELAYS_MS = [60_000, 300_000, 900_000]

export interface EnqueueInput {
  toNumber: string
  body?: string
  templateSlug?: string
  payload?: Record<string, string>
  companyId?: string | null
  priority?: number
  maxRetries?: number
}

export interface QueueItemDto {
  id: string
  templateSlug: string | null
  toNumber: string
  body: string
  companyId: string | null
  scope: DeviceScope
  status: QueueStatus
  assignedDeviceId: string | null
  retryCount: number
  maxRetries: number
  priority: number
  scheduledAt: string
  dispatchedAt: string | null
  processedAt: string | null
  lastError: string | null
  createdAt: string
}

export interface HistoryItemDto {
  id: string
  queueId: string | null
  toNumber: string
  status: 'sent' | 'failed'
  deviceId: string | null
  simSlot: number | null
  providerMessageRef: string | null
  templateSlug: string | null
  companyId: string | null
  errorMessage: string | null
  createdAt: string
}

export interface DeviceMessageDto {
  id: string
  toNumber: string
  body: string
  simSlot: number | null
}

function queueRowToDto(row: SmsQueueRow): QueueItemDto {
  return {
    id: row.id,
    templateSlug: row.template_slug,
    toNumber: row.to_number,
    body: row.body,
    companyId: row.company_id,
    scope: row.scope,
    status: row.status,
    assignedDeviceId: row.assigned_device_id,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    priority: row.priority,
    scheduledAt: row.scheduled_at.toISOString(),
    dispatchedAt: row.dispatched_at?.toISOString() ?? null,
    processedAt: row.processed_at?.toISOString() ?? null,
    lastError: row.last_error,
    createdAt: row.created_at.toISOString(),
  }
}

function historyRowToDto(row: SmsHistoryRow): HistoryItemDto {
  return {
    id: row.id,
    queueId: row.queue_id,
    toNumber: row.to_number,
    status: row.status,
    deviceId: row.device_id,
    simSlot: row.sim_slot,
    providerMessageRef: row.provider_message_ref,
    templateSlug: row.template_slug,
    companyId: row.company_id,
    errorMessage: row.error_message,
    createdAt: row.created_at.toISOString(),
  }
}

/** Resolve final body (raw or templated) and enqueue a pending row scoped by companyId. */
export async function enqueue(input: EnqueueInput): Promise<{ queueId: string; status: 'queued' }> {
  const payload = input.payload ?? {}
  let body = input.body ?? ''
  let templateSlug: string | null = input.templateSlug ?? null

  if (input.templateSlug) {
    const template = await resolveTemplate(input.templateSlug, input.companyId)
    if (!template) {
      throw new Error(`Template not found: ${input.templateSlug}`)
    }
    await validateTemplatePayload(template, payload)
    body = renderBody(template, payload)
    templateSlug = template.slug
  }

  if (!body.trim()) {
    throw new Error('Message body is empty')
  }

  const id = nanoid()
  await db('sms_queue').insert({
    id,
    template_slug: templateSlug,
    to_number: input.toNumber,
    body,
    payload_json: JSON.stringify(payload),
    company_id: input.companyId ?? null,
    scope: input.companyId ? 'company' : 'platform',
    status: 'pending',
    assigned_device_id: null,
    sim_slot: null,
    retry_count: 0,
    max_retries: input.maxRetries ?? 3,
    priority: input.priority ?? 0,
    scheduled_at: db.fn.now(3),
    dispatched_at: null,
    processed_at: null,
    last_error: null,
    created_at: db.fn.now(3),
  })

  return { queueId: id, status: 'queued' }
}

/** Atomically claim up to `max` due pending rows matching the device scope. */
export async function claimMessagesForDevice(device: SmsDeviceRow, max: number): Promise<DeviceMessageDto[]> {
  return db.transaction(async (trx) => {
    const query = trx<SmsQueueRow>('sms_queue')
      .where('status', 'pending')
      .andWhere('scheduled_at', '<=', trx.fn.now(3))
      .andWhere('scope', device.scope)

    if (device.scope === 'company') {
      query.andWhere('company_id', device.company_id)
    } else {
      query.whereNull('company_id')
    }

    const rows = await query
      .orderBy('priority', 'desc')
      .orderBy('scheduled_at', 'asc')
      .limit(max)
      .forUpdate()
      .skipLocked()

    if (rows.length === 0) return []

    const ids = rows.map((r) => r.id)
    await trx('sms_queue')
      .whereIn('id', ids)
      .update({
        status: 'processing',
        assigned_device_id: device.id,
        dispatched_at: trx.fn.now(3),
      })

    return rows.map((r) => ({ id: r.id, toNumber: r.to_number, body: r.body, simSlot: r.sim_slot }))
  })
}

/** Device reports the outcome of a send. Handles retry/backoff and history. */
export async function reportStatus(
  queueId: string,
  deviceId: string,
  input: { status: 'sent' | 'failed'; simSlot?: number; providerMessageRef?: string; error?: string },
): Promise<void> {
  const row = await db<SmsQueueRow>('sms_queue').where({ id: queueId }).first()
  if (!row) {
    throw new Error('Queue item not found')
  }

  if (input.status === 'sent') {
    await db.transaction(async (trx) => {
      await trx('sms_queue').where({ id: queueId }).update({
        status: 'sent',
        sim_slot: input.simSlot ?? row.sim_slot ?? null,
        processed_at: trx.fn.now(3),
        last_error: null,
      })
      await trx('sms_history').insert({
        id: nanoid(),
        queue_id: queueId,
        to_number: row.to_number,
        status: 'sent',
        device_id: deviceId,
        sim_slot: input.simSlot ?? row.sim_slot ?? null,
        provider_message_ref: input.providerMessageRef ?? null,
        template_slug: row.template_slug,
        company_id: row.company_id,
        error_message: null,
        created_at: trx.fn.now(3),
      })
    })
    return
  }

  const message = input.error ?? 'Send failed'
  const nextRetryCount = row.retry_count + 1

  if (nextRetryCount < row.max_retries) {
    const delayMs = RETRY_DELAYS_MS[Math.min(nextRetryCount - 1, RETRY_DELAYS_MS.length - 1)]
    await db('sms_queue').where({ id: queueId }).update({
      status: 'pending',
      retry_count: nextRetryCount,
      assigned_device_id: null,
      scheduled_at: new Date(Date.now() + delayMs),
      last_error: message,
      processed_at: db.fn.now(3),
    })
    return
  }

  await db.transaction(async (trx) => {
    await trx('sms_queue').where({ id: queueId }).update({
      status: 'failed',
      retry_count: nextRetryCount,
      last_error: message,
      processed_at: trx.fn.now(3),
    })
    await trx('sms_history').insert({
      id: nanoid(),
      queue_id: queueId,
      to_number: row.to_number,
      status: 'failed',
      device_id: deviceId,
      sim_slot: input.simSlot ?? row.sim_slot ?? null,
      provider_message_ref: null,
      template_slug: row.template_slug,
      company_id: row.company_id,
      error_message: message,
      created_at: trx.fn.now(3),
    })
  })
}

/** Reaper: revert rows stuck in `processing` past the timeout back to pending. */
export async function requeueStuckProcessing(timeoutMs: number): Promise<number> {
  const cutoff = new Date(Date.now() - timeoutMs)
  return db<SmsQueueRow>('sms_queue')
    .where('status', 'processing')
    .andWhere('dispatched_at', '<', cutoff)
    .update({
      status: 'pending',
      assigned_device_id: null,
      last_error: 'Device timed out; re-queued',
    })
}

export async function listQueue(filters: {
  status?: QueueStatus
  companyId?: string
  page: number
  pageSize: number
}) {
  const query = db<SmsQueueRow>('sms_queue').orderBy('created_at', 'desc')
  if (filters.status) query.where({ status: filters.status })
  if (filters.companyId) query.where({ company_id: filters.companyId })

  const offset = (filters.page - 1) * filters.pageSize
  const [rows, countResult] = await Promise.all([
    query.clone().limit(filters.pageSize).offset(offset),
    query.clone().count<{ count: number }[]>('* as count'),
  ])

  return {
    items: rows.map(queueRowToDto),
    page: filters.page,
    pageSize: filters.pageSize,
    total: Number(countResult[0]?.count ?? 0),
  }
}

export async function retryQueueItem(id: string): Promise<QueueItemDto> {
  const row = await db<SmsQueueRow>('sms_queue').where({ id }).first()
  if (!row) throw new Error('Queue item not found')
  if (row.status !== 'failed') throw new Error('Only failed items can be retried')

  await db('sms_queue').where({ id }).update({
    status: 'pending',
    retry_count: 0,
    assigned_device_id: null,
    scheduled_at: db.fn.now(3),
    last_error: null,
    processed_at: null,
  })

  const updated = await db<SmsQueueRow>('sms_queue').where({ id }).first()
  return queueRowToDto(updated!)
}

export async function listHistory(filters: {
  status?: 'sent' | 'failed'
  search?: string
  companyId?: string
  page: number
  pageSize: number
}) {
  const query = db<SmsHistoryRow>('sms_history').orderBy('created_at', 'desc')
  if (filters.status) query.where({ status: filters.status })
  if (filters.companyId) query.where({ company_id: filters.companyId })
  if (filters.search) {
    const pattern = `%${filters.search}%`
    query.where(function applySearch() {
      this.where('to_number', 'like', pattern).orWhere('template_slug', 'like', pattern)
    })
  }

  const offset = (filters.page - 1) * filters.pageSize
  const [rows, countResult] = await Promise.all([
    query.clone().limit(filters.pageSize).offset(offset),
    query.clone().count<{ count: number }[]>('* as count'),
  ])

  return {
    items: rows.map(historyRowToDto),
    page: filters.page,
    pageSize: filters.pageSize,
    total: Number(countResult[0]?.count ?? 0),
  }
}

export async function getDashboardStats(companyId?: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const baseQueue = db<SmsQueueRow>('sms_queue')
  const baseHistory = db<SmsHistoryRow>('sms_history').where('created_at', '>=', since)
  const baseDevices = db<SmsDeviceRow>('sms_devices')

  if (companyId) {
    baseQueue.where({ company_id: companyId })
    baseHistory.where({ company_id: companyId })
    baseDevices.where({ scope: 'company', company_id: companyId })
  }

  const [pendingCount, failedCount, sentCount, approvedDevices, recentHistory] = await Promise.all([
    baseQueue.clone().where({ status: 'pending' }).count<{ count: number }[]>('* as count'),
    baseQueue.clone().where({ status: 'failed' }).where('created_at', '>=', since).count<{ count: number }[]>('* as count'),
    baseHistory.clone().where({ status: 'sent' }).count<{ count: number }[]>('* as count'),
    baseDevices.clone().where({ status: 'approved' }).count<{ count: number }[]>('* as count'),
    db<SmsHistoryRow>('sms_history')
      .modify((qb) => {
        if (companyId) qb.where({ company_id: companyId })
      })
      .orderBy('created_at', 'desc')
      .limit(10),
  ])

  return {
    pendingCount: Number(pendingCount[0]?.count ?? 0),
    failedCount24h: Number(failedCount[0]?.count ?? 0),
    sentCount24h: Number(sentCount[0]?.count ?? 0),
    approvedDevices: Number(approvedDevices[0]?.count ?? 0),
    recentActivity: recentHistory.map(historyRowToDto),
  }
}
