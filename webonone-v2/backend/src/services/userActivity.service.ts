import { db } from '../models/db.js'
import type { CompanyEventRow } from '../repositories/companyEvent.repository.js'
import type { CompanyEventSessionTokenRow } from '../repositories/companyEventSessionToken.repository.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import * as saleRepo from '../repositories/companySale.repository.js'
import * as sessionTokenRepo from '../repositories/companyEventSessionToken.repository.js'
import * as staffRepo from '../repositories/companyStaff.repository.js'
import {
  buildWorkflowProgress,
  loadWorkflowStepDefs,
  type TokenWorkflowProgressDto,
} from './tokenWorkflowProgress.js'

export type UserActivityType = 'session_token' | 'event_attendee' | 'event_staff' | 'sale'

export type UserActivityItem = {
  id: string
  type: UserActivityType
  title: string
  subtitle: string | null
  status: string | null
  occurredAt: string
  meta?: Record<string, unknown>
}

export type SessionTokenHistoryDetail = {
  tokenId: string
  tokenNumber: number
  tokenLabel: string
  status: string
  userId: string
  userDisplayName: string
  userEmail: string | null
  eventId: string
  occurrenceDate: string
  serviceId: string
  serviceName: string
  formTemplateId: string | null
  timeMode: 'duration' | 'window'
  startTime: string
  endTime: string
  spaceId: string | null
  spaceName: string | null
  staffId: string
  staffDisplayName: string
  createdAt: string
  workflowProgress: TokenWorkflowProgressDto
}

const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

function formatDisplayDate(value: string | Date): string {
  let date: Date
  if (typeof value === 'string') {
    const ymd = value.slice(0, 10)
    const parts = ymd.split('-').map(Number)
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return ymd
    const [y, m, d] = parts
    date = new Date(y, m - 1, d)
  } else {
    date = value
  }
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value.slice(0, 10) : ''
  }
  return date.toLocaleDateString('en-US', DISPLAY_DATE_OPTIONS)
}

function toIso(value: Date | string): string {
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? value : d.toISOString()
  }
  return value.toISOString()
}

function normalizeTime(value: string): string {
  return String(value).slice(0, 5)
}

function serviceError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

export async function listUserActivity(input: {
  companyId: string
  userId: string
  page?: number
  pageSize?: number
}): Promise<{ items: UserActivityItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const tokens = await db<CompanyEventSessionTokenRow>('company_event_session_tokens')
    .where({ company_id: input.companyId, user_id: input.userId })
    .orderBy('created_at', 'desc')
    .limit(200)

  const eventIds = [...new Set(tokens.map((t) => t.event_id))]
  const eventsById = new Map<string, CompanyEventRow>()
  if (eventIds.length > 0) {
    const events = await db<CompanyEventRow>('company_events')
      .where({ company_id: input.companyId })
      .whereIn('id', eventIds)
    for (const event of events) {
      eventsById.set(event.id, event)
    }
  }

  const tokenItems: UserActivityItem[] = tokens.map((token) => {
    const event = eventsById.get(token.event_id)
    const occurrence = formatDisplayDate(token.occurrence_date)
    const start = event ? normalizeTime(String(event.start_time)) : null
    const end = event ? normalizeTime(String(event.end_time)) : null
    const timeRange = start && end ? `${start}–${end}` : null
    return {
      id: `token:${token.id}`,
      type: 'session_token',
      title: event?.service_name ?? `Token #${token.token_number}`,
      subtitle: [`Token #${token.token_number}`, occurrence, timeRange]
        .filter(Boolean)
        .join(' · '),
      status: token.status,
      occurredAt: toIso(token.created_at),
      meta: {
        tokenId: token.id,
        eventId: token.event_id,
        occurrenceDate: occurrence,
        tokenNumber: token.token_number,
        serviceId: event?.service_id ?? null,
        serviceName: event?.service_name ?? null,
        staffId: event?.staff_id ?? null,
        staffDisplayName: event?.staff_display_name ?? null,
        spaceId: event?.space_id ?? null,
        spaceName: event?.space_name ?? null,
        startTime: start,
        endTime: end,
      },
    }
  })

  const attendeeEvents = await db<CompanyEventRow>('company_events')
    .where({ company_id: input.companyId, attendee_user_id: input.userId })
    .orderBy('updated_at', 'desc')
    .limit(200)

  const attendeeItems: UserActivityItem[] = attendeeEvents.map((event) => ({
    id: `attendee:${event.id}`,
    type: 'event_attendee',
    title: event.service_name,
    subtitle: `Booked · starts ${formatDisplayDate(event.starts_on)} ${String(event.start_time).slice(0, 5)}`,
    status: event.recurrence === 'none' ? 'one-time' : event.recurrence,
    occurredAt: toIso(event.updated_at),
    meta: {
      eventId: event.id,
      serviceId: event.service_id,
      staffId: event.staff_id,
      staffDisplayName: event.staff_display_name,
    },
  }))

  const staffRow = await staffRepo.findStaffByUserId(input.companyId, input.userId)
  let staffItems: UserActivityItem[] = []
  if (staffRow) {
    const staffEvents = await db<CompanyEventRow>('company_events')
      .where({ company_id: input.companyId, staff_id: staffRow.id })
      .orderBy('updated_at', 'desc')
      .limit(200)
    staffItems = staffEvents.map((event) => ({
      id: `staff:${event.id}`,
      type: 'event_staff',
      title: event.service_name,
      subtitle: `Assigned staff · starts ${formatDisplayDate(event.starts_on)} ${String(event.start_time).slice(0, 5)}`,
      status: event.recurrence === 'none' ? 'one-time' : event.recurrence,
      occurredAt: toIso(event.updated_at),
      meta: {
        eventId: event.id,
        serviceId: event.service_id,
        attendeeDisplayName: event.attendee_display_name,
        staffId: event.staff_id,
        staffDisplayName: event.staff_display_name,
      },
    }))
  }

  const sales = await saleRepo.listSalesForCustomer(input.companyId, input.userId, 200)
  const saleItems: UserActivityItem[] = sales.map((sale) => {
    const total = catalogRepo.parseMoney(sale.total) ?? 0
    return {
      id: `sale:${sale.id}`,
      type: 'sale' as const,
      title: sale.bill_number,
      subtitle: `${sale.currency} ${total.toFixed(2)} · ${sale.payment_method}`,
      status: sale.status,
      occurredAt: toIso(sale.created_at),
      meta: {
        saleId: sale.id,
        billNumber: sale.bill_number,
        total,
        currency: sale.currency,
        paymentMethod: sale.payment_method,
        status: sale.status,
      },
    }
  })

  const merged = [...tokenItems, ...attendeeItems, ...staffItems, ...saleItems].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  const total = merged.length
  const offset = (page - 1) * pageSize
  const items = merged.slice(offset, offset + pageSize)

  return { items, total, page, pageSize }
}

export async function getSessionTokenHistoryDetail(input: {
  companyId: string
  tokenId: string
}): Promise<SessionTokenHistoryDetail> {
  const token = await sessionTokenRepo.findTokenById(input.companyId, input.tokenId)
  if (!token) {
    throw serviceError('Session token not found', 404)
  }

  const event = await db<CompanyEventRow>('company_events')
    .where({ id: token.event_id, company_id: input.companyId })
    .first()
  if (!event) {
    throw serviceError('Event not found for session token', 404)
  }

  const occurrenceDate = formatDisplayDate(token.occurrence_date)

  let formTemplateId: string | null = null
  const serviceRows = await catalogRepo.findByIds(input.companyId, 'services', [event.service_id])
  const serviceRow = serviceRows[0]
  if (serviceRow) {
    const mapped = catalogRepo.mapCatalogRow('services', serviceRow) as {
      formTemplateId?: string | null
    }
    formTemplateId = mapped.formTemplateId ?? null
  }

  const defs = await loadWorkflowStepDefs(input.companyId, event.service_id)
  return {
    tokenId: token.id,
    tokenNumber: token.token_number,
    tokenLabel: `#${token.token_number}`,
    status: token.status,
    userId: token.user_id,
    userDisplayName: token.user_display_name,
    userEmail: token.user_email,
    eventId: event.id,
    occurrenceDate,
    serviceId: event.service_id,
    serviceName: event.service_name,
    formTemplateId,
    timeMode: event.time_mode,
    startTime: normalizeTime(String(event.start_time)),
    endTime: normalizeTime(String(event.end_time)),
    spaceId: event.space_id,
    spaceName: event.space_name,
    staffId: event.staff_id,
    staffDisplayName: event.staff_display_name,
    createdAt: toIso(token.created_at),
    workflowProgress: buildWorkflowProgress(defs, token),
  }
}
