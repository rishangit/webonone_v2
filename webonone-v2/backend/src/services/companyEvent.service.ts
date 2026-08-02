import { nanoid } from 'nanoid'
import type {
  CreateCompanyEventBody,
  CreateSessionTokenBody,
  UpdateCompanyEventBody,
} from '../schemas/companyEventSchemas.js'
import { getLibraryService } from '../clients/dataCatalogClient.js'
import * as eventRepo from '../repositories/companyEvent.repository.js'
import * as sessionTokenRepo from '../repositories/companyEventSessionToken.repository.js'
import * as staffRepo from '../repositories/companyStaff.repository.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'

export type CompanyEventDto = {
  id: string
  companyId: string
  serviceId: string
  serviceName: string
  timeMode: 'duration' | 'window'
  staffId: string
  staffDisplayName: string
  attendeeUserId: string | null
  attendeeDisplayName: string | null
  attendeeEmail: string | null
  startsOn: string
  startTime: string
  endTime: string
  weekdays: number[]
  recurrence: 'none' | 'weekly'
  recurrenceUntil: string | null
  createdAt: string
  updatedAt: string
}

export type CompanyEventOccurrenceDto = CompanyEventDto & {
  occurrenceDate: string
  start: string
  end: string
  title: string
}

export type SessionTokenDto = {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  tokenNumber: number
  tokenLabel: string
  userId: string
  userDisplayName: string
  userEmail: string | null
  createdAt: string
  updatedAt: string
}

function serviceError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null
  const match = /^(\d{2}:\d{2})/.exec(String(value))
  return match?.[1] ?? String(value)
}

function toDateOnly(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

function addDaysYmd(ymd: string, days: number): string {
  const date = parseYmd(ymd)
  date.setDate(date.getDate() + days)
  return toDateOnly(date)
}

function weekdayOfYmd(ymd: string): number {
  return parseYmd(ymd).getDay()
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h! * 60 + m!
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function addMinutesToTime(hhmm: string, minutes: number): string {
  return minutesToTime(timeToMinutes(hhmm) + minutes)
}

function mapEvent(row: eventRepo.CompanyEventRow): CompanyEventDto {
  const startsOn = toDateOnly(row.starts_on)
  let weekdays = eventRepo.parseWeekdays(row.weekdays)
  if (weekdays.length === 0) {
    weekdays = [weekdayOfYmd(startsOn)]
  }
  return {
    id: row.id,
    companyId: row.company_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    timeMode: row.time_mode,
    staffId: row.staff_id,
    staffDisplayName: row.staff_display_name,
    attendeeUserId: row.attendee_user_id,
    attendeeDisplayName: row.attendee_display_name,
    attendeeEmail: row.attendee_email,
    startsOn,
    startTime: normalizeTime(row.start_time) ?? '00:00',
    endTime: normalizeTime(row.end_time) ?? '00:00',
    weekdays,
    recurrence: row.recurrence,
    recurrenceUntil: row.recurrence_until ? toDateOnly(row.recurrence_until) : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

/** Map a raw event row to DTO (shared by company + public catalog booking). */
export function mapEventRow(row: eventRepo.CompanyEventRow): CompanyEventDto {
  return mapEvent(row)
}

type ServiceTimeInfo = {
  id: string
  name: string
  timeMode: 'duration' | 'window'
  durationMinutes: number | null
  startTime: string | null
  endTime: string | null
}

async function loadService(
  companyId: string,
  serviceId: string,
  accessToken?: string,
): Promise<ServiceTimeInfo> {
  const row = await catalogRepo.findById(companyId, 'services', serviceId)
  if (!row) throw serviceError('Service not found', 404)
  const mapped = catalogRepo.mapCatalogRow('services', row) as {
    id: string
    name: string | null
    bindingMode: 'linked' | 'forked' | 'custom'
    libraryEntityId: string | null
    payload: {
      timeMode?: 'duration' | 'window'
      durationMinutes?: number | null
      startTime?: string | null
      endTime?: string | null
      name?: string
    } | null
  }

  const payload = mapped.payload
  if (payload) {
    return {
      id: mapped.id,
      name: mapped.name ?? payload.name ?? 'Service',
      timeMode: payload.timeMode === 'window' ? 'window' : 'duration',
      durationMinutes: payload.durationMinutes ?? null,
      startTime: normalizeTime(payload.startTime ?? null),
      endTime: normalizeTime(payload.endTime ?? null),
    }
  }

  // Linked rows store name/time on Data library only.
  if (mapped.bindingMode === 'linked' && mapped.libraryEntityId) {
    if (!accessToken) {
      throw serviceError('Linked service requires an authenticated Data library lookup', 400)
    }
    try {
      const library = await getLibraryService(mapped.libraryEntityId, accessToken)
      if (!library) throw serviceError('Linked library service not found', 404)
      return {
        id: mapped.id,
        name: library.name,
        timeMode: library.timeMode === 'window' ? 'window' : 'duration',
        durationMinutes: library.durationMinutes ?? null,
        startTime: normalizeTime(library.startTime ?? null),
        endTime: normalizeTime(library.endTime ?? null),
      }
    } catch (err) {
      if ((err as Error & { statusCode?: number }).statusCode) throw err
      throw serviceError(
        err instanceof Error ? err.message : 'Failed to load linked library service',
        502,
      )
    }
  }

  throw serviceError('Service catalog data is incomplete', 400)
}

async function loadStaffWithSchedule(companyId: string, staffId: string) {
  const staff = await staffRepo.findStaffById(companyId, staffId)
  if (!staff) throw serviceError('Staff not found', 404)
  const schedules = await staffRepo.listSchedulesByStaffIds([staffId])
  return { staff, schedules }
}

function assertStaffWorksOnWeekdays(
  schedules: staffRepo.CompanyStaffScheduleRow[],
  weekdays: number[],
  startTime: string,
  endTime: string,
): void {
  for (const weekday of weekdays) {
    const day = schedules.find((s) => Number(s.day_of_week) === weekday)
    if (!day || !day.is_working) {
      throw serviceError(
        `Weekday ${weekday} is not a working day for this staff member`,
        400,
      )
    }
    const dayStart = normalizeTime(day.start_time)
    const dayEnd = normalizeTime(day.end_time)
    if (!dayStart || !dayEnd) {
      throw serviceError('Staff working hours are incomplete for a selected weekday', 400)
    }
    if (startTime < dayStart || endTime > dayEnd) {
      throw serviceError(
        'Event time must fall within staff working hours on every selected weekday',
        400,
      )
    }
  }
}

function resolveTimes(
  service: ServiceTimeInfo,
  bodyStartTime: string | undefined,
): { startTime: string; endTime: string } {
  if (service.timeMode === 'window') {
    if (!service.startTime || !service.endTime) {
      throw serviceError('Service specific time is incomplete', 400)
    }
    return { startTime: service.startTime, endTime: service.endTime }
  }
  if (!bodyStartTime) {
    throw serviceError('Start time is required for duration services', 400)
  }
  if (!service.durationMinutes || service.durationMinutes < 1) {
    throw serviceError('Service duration is incomplete', 400)
  }
  return {
    startTime: bodyStartTime,
    endTime: addMinutesToTime(bodyStartTime, service.durationMinutes),
  }
}

function resolveAttendee(
  timeMode: 'duration' | 'window',
  body: {
    attendee_user_id?: string | null
    attendee_display_name?: string | null
    attendee_email?: string | null
  },
): {
  attendee_user_id: string | null
  attendee_display_name: string | null
  attendee_email: string | null
} {
  if (timeMode === 'window') {
    return {
      attendee_user_id: null,
      attendee_display_name: null,
      attendee_email: null,
    }
  }
  const userId = body.attendee_user_id?.trim()
  if (!userId) {
    throw serviceError('Attendee is required for duration services', 400)
  }
  return {
    attendee_user_id: userId,
    attendee_display_name: body.attendee_display_name?.trim() || null,
    attendee_email: body.attendee_email?.trim() || null,
  }
}

export function expandOccurrences(
  event: CompanyEventDto,
  fromYmd: string,
  toYmd: string,
): CompanyEventOccurrenceDto[] {
  const results: CompanyEventOccurrenceDto[] = []
  const seriesStart = event.startsOn
  const seriesEnd =
    event.recurrenceUntil ??
    (event.recurrence === 'none' ? event.startsOn : toYmd)
  const weekdays =
    event.weekdays.length > 0 ? new Set(event.weekdays) : new Set([weekdayOfYmd(seriesStart)])

  let cursor = seriesStart
  while (cursor <= seriesEnd && cursor <= toYmd) {
    if (cursor >= fromYmd && weekdays.has(weekdayOfYmd(cursor))) {
      results.push(toOccurrence(event, cursor))
    }
    cursor = addDaysYmd(cursor, 1)
  }
  return results
}

function toOccurrence(event: CompanyEventDto, occurrenceDate: string): CompanyEventOccurrenceDto {
  return {
    ...event,
    occurrenceDate,
    start: `${occurrenceDate}T${event.startTime}:00`,
    end: `${occurrenceDate}T${event.endTime}:00`,
    title: event.serviceName,
  }
}

export async function listCompanyEvents(
  companyId: string,
  opts: { q?: string; page?: number; pageSize?: number; from?: string; to?: string },
): Promise<{
  items: CompanyEventDto[] | CompanyEventOccurrenceDto[]
  total: number
  page: number
  pageSize: number
  mode: 'series' | 'occurrences'
}> {
  const rows = await eventRepo.listEventsByCompany(companyId)
  let series = rows.map(mapEvent)

  const q = opts.q?.trim().toLowerCase()
  if (q) {
    series = series.filter(
      (e) =>
        e.serviceName.toLowerCase().includes(q) ||
        e.staffDisplayName.toLowerCase().includes(q) ||
        (e.attendeeDisplayName?.toLowerCase().includes(q) ?? false),
    )
  }

  if (opts.from && opts.to) {
    const occurrences = series.flatMap((e) => expandOccurrences(e, opts.from!, opts.to!))
    occurrences.sort((a, b) => a.start.localeCompare(b.start))
    return {
      items: occurrences,
      total: occurrences.length,
      page: 1,
      pageSize: occurrences.length || 20,
      mode: 'occurrences',
    }
  }

  const page = opts.page ?? 1
  const pageSize = opts.pageSize ?? 20
  const start = (page - 1) * pageSize
  return {
    items: series.slice(start, start + pageSize),
    total: series.length,
    page,
    pageSize,
    mode: 'series',
  }
}

export async function getCompanyEvent(companyId: string, eventId: string): Promise<CompanyEventDto> {
  const row = await eventRepo.findEventById(companyId, eventId)
  if (!row) throw serviceError('Event not found', 404)
  return mapEvent(row)
}

export async function createCompanyEvent(
  companyId: string,
  body: CreateCompanyEventBody,
  options?: { accessToken?: string },
): Promise<CompanyEventDto> {
  const service = await loadService(companyId, body.service_id, options?.accessToken)
  const { staff, schedules } = await loadStaffWithSchedule(companyId, body.staff_id)
  const times = resolveTimes(service, body.start_time)
  const weekdays = [...new Set(body.weekdays)].sort((a, b) => a - b)
  assertStaffWorksOnWeekdays(schedules, weekdays, times.startTime, times.endTime)
  const attendee = resolveAttendee(service.timeMode, body)

  const id = nanoid()
  await eventRepo.insertEvent({
    id,
    company_id: companyId,
    service_id: service.id,
    service_name: service.name,
    time_mode: service.timeMode,
    staff_id: staff.id,
    staff_display_name: staff.display_name,
    attendee_user_id: attendee.attendee_user_id,
    attendee_display_name: attendee.attendee_display_name,
    attendee_email: attendee.attendee_email,
    starts_on: body.starts_on,
    start_time: times.startTime,
    end_time: times.endTime,
    weekdays,
    recurrence: 'weekly',
    recurrence_until: body.recurrence_until,
  })
  return getCompanyEvent(companyId, id)
}

export async function updateCompanyEvent(
  companyId: string,
  eventId: string,
  body: UpdateCompanyEventBody,
  options?: { accessToken?: string },
): Promise<CompanyEventDto> {
  const existing = await eventRepo.findEventById(companyId, eventId)
  if (!existing) throw serviceError('Event not found', 404)

  const serviceId = body.service_id ?? existing.service_id
  const staffId = body.staff_id ?? existing.staff_id
  const startsOn = body.starts_on ?? toDateOnly(existing.starts_on)
  const mappedExisting = mapEvent(existing)
  const weekdays = body.weekdays
    ? [...new Set(body.weekdays)].sort((a, b) => a - b)
    : mappedExisting.weekdays
  const recurrenceUntil =
    body.recurrence_until !== undefined
      ? body.recurrence_until
      : mappedExisting.recurrenceUntil

  if (!recurrenceUntil) {
    throw serviceError('End date is required', 400)
  }
  if (recurrenceUntil < startsOn) {
    throw serviceError('End date must be on or after the start date', 400)
  }

  const service = await loadService(companyId, serviceId, options?.accessToken)
  const { staff, schedules } = await loadStaffWithSchedule(companyId, staffId)
  const times = resolveTimes(
    service,
    body.start_time ?? normalizeTime(existing.start_time) ?? undefined,
  )
  assertStaffWorksOnWeekdays(schedules, weekdays, times.startTime, times.endTime)

  const attendee = resolveAttendee(service.timeMode, {
    attendee_user_id:
      body.attendee_user_id !== undefined ? body.attendee_user_id : existing.attendee_user_id,
    attendee_display_name:
      body.attendee_display_name !== undefined
        ? body.attendee_display_name
        : existing.attendee_display_name,
    attendee_email:
      body.attendee_email !== undefined ? body.attendee_email : existing.attendee_email,
  })

  await eventRepo.updateEvent(companyId, eventId, {
    service_id: service.id,
    service_name: service.name,
    time_mode: service.timeMode,
    staff_id: staff.id,
    staff_display_name: staff.display_name,
    attendee_user_id: attendee.attendee_user_id,
    attendee_display_name: attendee.attendee_display_name,
    attendee_email: attendee.attendee_email,
    starts_on: startsOn,
    start_time: times.startTime,
    end_time: times.endTime,
    weekdays,
    recurrence: 'weekly',
    recurrence_until: recurrenceUntil,
  })
  return getCompanyEvent(companyId, eventId)
}

export async function deleteCompanyEvent(companyId: string, eventId: string): Promise<void> {
  const deleted = await eventRepo.deleteEvent(companyId, eventId)
  if (!deleted) throw serviceError('Event not found', 404)
}

function formatTokenLabel(tokenNumber: number): string {
  return String(tokenNumber).padStart(3, '0')
}

function mapSessionToken(row: sessionTokenRepo.CompanyEventSessionTokenRow): SessionTokenDto {
  const occurrenceDate = toDateOnly(row.occurrence_date)
  return {
    id: row.id,
    companyId: row.company_id,
    eventId: row.event_id,
    occurrenceDate,
    tokenNumber: row.token_number,
    tokenLabel: formatTokenLabel(row.token_number),
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    userEmail: row.user_email,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function assertValidSessionOccurrence(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<CompanyEventDto> {
  const event = await getCompanyEvent(companyId, eventId)
  const matches = expandOccurrences(event, occurrenceDate, occurrenceDate)
  if (matches.length === 0) {
    throw serviceError('This date is not part of the event series', 400)
  }
  return event
}

export async function listSessionTokens(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionTokenDto[]> {
  await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  const rows = await sessionTokenRepo.listTokensForSession(companyId, eventId, occurrenceDate)
  return rows.map(mapSessionToken)
}

export async function createSessionToken(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  body: CreateSessionTokenBody,
): Promise<SessionTokenDto> {
  await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)

  const userId = body.user_id.trim()
  const existing = await sessionTokenRepo.findTokenByUser(
    companyId,
    eventId,
    occurrenceDate,
    userId,
  )
  if (existing) {
    throw serviceError('This user already has a token for this session', 409)
  }

  const nextNumber =
    (await sessionTokenRepo.getMaxTokenNumber(companyId, eventId, occurrenceDate)) + 1
  const id = nanoid()
  try {
    const row = await sessionTokenRepo.insertToken({
      id,
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      token_number: nextNumber,
      user_id: userId,
      user_display_name: body.user_display_name.trim(),
      user_email: body.user_email?.trim() || null,
    })
    return mapSessionToken(row)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'ER_DUP_ENTRY') {
      throw serviceError('This user already has a token for this session', 409)
    }
    throw err
  }
}

export async function getNextSessionTokenLabel(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<{ tokenNumber: number; tokenLabel: string }> {
  await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  const nextNumber =
    (await sessionTokenRepo.getMaxTokenNumber(companyId, eventId, occurrenceDate)) + 1
  return { tokenNumber: nextNumber, tokenLabel: formatTokenLabel(nextNumber) }
}

export async function getSessionTokenForUser(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  userId: string,
): Promise<SessionTokenDto | null> {
  await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  const row = await sessionTokenRepo.findTokenByUser(
    companyId,
    eventId,
    occurrenceDate,
    userId,
  )
  return row ? mapSessionToken(row) : null
}
