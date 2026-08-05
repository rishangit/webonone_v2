import { db } from '../models/db.js'
import * as staffRepo from './companyStaff.repository.js'

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
  space_id: string | null
  space_name: string | null
  starts_on: string | Date
  start_time: string
  end_time: string
  weekdays: string | number[] | null
  recurrence:
    | 'none'
    | 'weekly'
    | 'biweekly'
    | 'monthly_first_week'
    | 'monthly_by_date'
  recurrence_until: string | Date | null
  created_at: Date
  updated_at: Date
}

export type EventRecurrence = CompanyEventRow['recurrence']

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

/** Events where the user is the attendee or the assigned staff for this company. */
export async function listEventsForMember(
  companyId: string,
  userId: string,
): Promise<CompanyEventRow[]> {
  const staff = await staffRepo.findStaffByUserId(companyId, userId)
  return db<CompanyEventRow>('company_events')
    .where({ company_id: companyId })
    .andWhere((qb) => {
      qb.where({ attendee_user_id: userId })
      if (staff) {
        qb.orWhere({ staff_id: staff.id })
      }
    })
    .orderBy('starts_on', 'desc')
    .orderBy('start_time', 'asc')
}

/** Whether a member may view this event (attendee or assigned staff). */
export async function memberCanAccessEvent(
  companyId: string,
  userId: string,
  event: Pick<CompanyEventRow, 'attendee_user_id' | 'staff_id'>,
): Promise<boolean> {
  if (event.attendee_user_id === userId) return true
  const staff = await staffRepo.findStaffByUserId(companyId, userId)
  return Boolean(staff && event.staff_id === staff.id)
}

/** Events the user booked as attendee or holds a session token for (any company). */
export async function listEventsForUserBookings(userId: string): Promise<CompanyEventRow[]> {
  const tokenEventIds = await db('company_event_session_tokens')
    .distinct('event_id')
    .where({ user_id: userId })
  const ids = tokenEventIds.map((row) => String((row as { event_id: string }).event_id))

  return db<CompanyEventRow>('company_events')
    .where((qb) => {
      qb.where({ attendee_user_id: userId })
      if (ids.length > 0) {
        qb.orWhereIn('id', ids)
      }
    })
    .orderBy('starts_on', 'desc')
    .orderBy('start_time', 'asc')
}

export async function findEventByIdAnyCompany(
  eventId: string,
): Promise<CompanyEventRow | undefined> {
  return db<CompanyEventRow>('company_events').where({ id: eventId }).first()
}

/** Whether the user is attendee or holds any session token on this event. */
export async function userCanAccessBookedEvent(
  userId: string,
  event: Pick<CompanyEventRow, 'id' | 'attendee_user_id'>,
): Promise<boolean> {
  if (event.attendee_user_id === userId) return true
  const token = await db('company_event_session_tokens')
    .where({ event_id: event.id, user_id: userId })
    .first()
  return Boolean(token)
}

/** Specific-time (window) events for a catalog service — used by public booking. */
export async function listWindowEventsByService(
  companyId: string,
  serviceId: string,
): Promise<CompanyEventRow[]> {
  return db<CompanyEventRow>('company_events')
    .where({
      company_id: companyId,
      service_id: serviceId,
      time_mode: 'window',
    })
    .orderBy('starts_on', 'asc')
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
  space_id: string | null
  space_name: string | null
  starts_on: string
  start_time: string
  end_time: string
  weekdays: number[]
  recurrence: EventRecurrence
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
    space_id: string | null
    space_name: string | null
    starts_on: string
    start_time: string
    end_time: string
    weekdays: number[]
    recurrence: EventRecurrence
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
