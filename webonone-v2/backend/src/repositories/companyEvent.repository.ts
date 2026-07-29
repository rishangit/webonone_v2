import { db } from '../models/db.js'

export interface CompanyEventRow {
  id: string
  company_id: string
  service_id: string
  service_name: string
  time_mode: 'duration' | 'window'
  staff_id: string
  staff_display_name: string
  attendee_user_id: string | null
  attendee_display_name: string | null
  attendee_email: string | null
  starts_on: string | Date
  start_time: string
  end_time: string
  weekdays: string | number[] | null
  recurrence: 'none' | 'weekly'
  recurrence_until: string | Date | null
  created_at: Date
  updated_at: Date
}

export function parseWeekdays(value: string | number[] | null | undefined): number[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    } catch {
      return []
    }
  }
  return []
}

export async function listEventsByCompany(companyId: string): Promise<CompanyEventRow[]> {
  return db<CompanyEventRow>('company_events')
    .where({ company_id: companyId })
    .orderBy('starts_on', 'desc')
    .orderBy('start_time', 'asc')
}

export async function findEventById(
  companyId: string,
  eventId: string,
): Promise<CompanyEventRow | undefined> {
  return db<CompanyEventRow>('company_events')
    .where({ id: eventId, company_id: companyId })
    .first()
}

export async function insertEvent(row: {
  id: string
  company_id: string
  service_id: string
  service_name: string
  time_mode: 'duration' | 'window'
  staff_id: string
  staff_display_name: string
  attendee_user_id: string | null
  attendee_display_name: string | null
  attendee_email: string | null
  starts_on: string
  start_time: string
  end_time: string
  weekdays: number[]
  recurrence: 'none' | 'weekly'
  recurrence_until: string | null
}): Promise<CompanyEventRow> {
  await db('company_events').insert({
    ...row,
    weekdays: JSON.stringify(row.weekdays),
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  const created = await db<CompanyEventRow>('company_events').where({ id: row.id }).first()
  if (!created) throw new Error('Failed to create event')
  return created
}

export async function updateEvent(
  companyId: string,
  eventId: string,
  patch: Partial<{
    service_id: string
    service_name: string
    time_mode: 'duration' | 'window'
    staff_id: string
    staff_display_name: string
    attendee_user_id: string | null
    attendee_display_name: string | null
    attendee_email: string | null
    starts_on: string
    start_time: string
    end_time: string
    weekdays: number[]
    recurrence: 'none' | 'weekly'
    recurrence_until: string | null
  }>,
): Promise<CompanyEventRow | undefined> {
  const { weekdays, ...rest } = patch
  await db('company_events')
    .where({ id: eventId, company_id: companyId })
    .update({
      ...rest,
      ...(weekdays !== undefined ? { weekdays: JSON.stringify(weekdays) } : {}),
      updated_at: db.fn.now(3),
    })
  return findEventById(companyId, eventId)
}

export async function deleteEvent(companyId: string, eventId: string): Promise<number> {
  return db('company_events').where({ id: eventId, company_id: companyId }).delete()
}
