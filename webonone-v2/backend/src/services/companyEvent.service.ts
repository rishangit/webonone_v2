import { nanoid } from 'nanoid'
import { rewriteMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'
import type {
  CreateCompanyEventBody,
  CreateSessionTokenBody,
  UpdateCompanyEventBody,
} from '../schemas/companyEventSchemas.js'
import {
  getLibraryCatalogItem,
  getLibraryService,
  listLibraryItemsByIds,
} from '../clients/dataCatalogClient.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import * as eventRepo from '../repositories/companyEvent.repository.js'
import * as sessionRunRepo from '../repositories/companyEventSessionRun.repository.js'
import * as sessionTokenRepo from '../repositories/companyEventSessionToken.repository.js'
import * as staffRepo from '../repositories/companyStaff.repository.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import {
  notifySessionEnded,
  notifySessionStarted,
  notifySessionTokenCalled,
  notifySessionTokenIssued,
} from './sessionTokenNotify.service.js'
import { notifyAppointmentBooked } from './appointmentNotify.service.js'
import type { PlatformRole } from '../middleware/requireSuperAdmin.js'

export type EventViewer = {
  userId: string
  role: PlatformRole
}

export type EventGalleryImage = {
  mediaId: string
  url: string
}

export type CompanyEventDto = {
  id: string
  companyId: string
  serviceId: string
  serviceName: string
  /** First gallery image URL for the linked company service, or null. */
  serviceImageUrl: string | null
  /** Effective service gallery (company override or linked library inherit). */
  serviceGalleryImages: EventGalleryImage[]
  /** Effective space gallery when the event has a space; empty otherwise. */
  spaceGalleryImages: EventGalleryImage[]
  /** Design form template id linked on the catalog service (ID copy). */
  formTemplateId: string | null
  timeMode: 'duration' | 'window'
  staffId: string
  staffDisplayName: string
  attendeeUserId: string | null
  attendeeDisplayName: string | null
  attendeeEmail: string | null
  spaceId: string | null
  spaceName: string | null
  startsOn: string
  startTime: string
  endTime: string
  weekdays: number[]
  recurrence:
    | 'none'
    | 'weekly'
    | 'biweekly'
    | 'monthly_first_week'
    | 'monthly_by_date'
  recurrenceUntil: string | null
  createdAt: string
  updatedAt: string
  /**
   * Personal (/me) window events — occurrence dates where this user holds a token.
   * When set, Sessions UI should list only these dates.
   */
  tokenOccurrenceDates?: string[]
}

export type CompanyEventOccurrenceDto = CompanyEventDto & {
  occurrenceDate: string
  start: string
  end: string
  title: string
}

export type SessionTokenStatus = 'waiting' | 'serving' | 'completed'
export type SessionRunStatus = 'scheduled' | 'started' | 'ended'

export type SessionTokenDto = {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  tokenNumber: number
  tokenLabel: string
  status: SessionTokenStatus
  userId: string
  userDisplayName: string
  userEmail: string | null
  createdAt: string
  updatedAt: string
}

export type SessionRunDto = {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  status: SessionRunStatus
  currentTokenId: string | null
  startedAt: string | null
  startedByUserId: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SessionDetailDto = {
  run: SessionRunDto
  items: SessionTokenDto[]
  /** Present on personal (/me) session views — queue labels from the full company token list. */
  queue?: {
    prevTokenLabel: string | null
    currentTokenLabel: string | null
    nextTokenLabel: string | null
  }
}

function computeSessionQueueLabels(
  items: SessionTokenDto[],
  run: SessionRunDto,
): {
  prevTokenLabel: string | null
  currentTokenLabel: string | null
  nextTokenLabel: string | null
} {
  const current =
    items.find((token) => token.id === run.currentTokenId) ??
    items.find((token) => token.status === 'serving') ??
    null
  const prev = items
    .filter((token) => token.status === 'completed')
    .reduce<SessionTokenDto | null>(
      (best, token) => (!best || token.tokenNumber > best.tokenNumber ? token : best),
      null,
    )
  const next = items
    .filter((token) => token.status === 'waiting')
    .reduce<SessionTokenDto | null>(
      (best, token) => (!best || token.tokenNumber < best.tokenNumber ? token : best),
      null,
    )
  return {
    prevTokenLabel: prev?.tokenLabel ?? null,
    currentTokenLabel: current?.tokenLabel ?? null,
    nextTokenLabel: next?.tokenLabel ?? null,
  }
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

function dayOfMonthOfYmd(ymd: string): number {
  return parseYmd(ymd).getDate()
}

function weeksBetween(startYmd: string, cursorYmd: string): number {
  const ms = parseYmd(cursorYmd).getTime() - parseYmd(startYmd).getTime()
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000))
}

/** Date in days 1–7 of the month with the given weekday (JS Sunday=0). */
function firstWeekDateInMonth(year: number, monthIndex: number, weekday: number): string {
  for (let day = 1; day <= 7; day++) {
    const date = new Date(year, monthIndex, day)
    if (date.getDay() === weekday) return toDateOnly(date)
  }
  // Unreachable: days 1–7 always contain every weekday once.
  return toDateOnly(new Date(year, monthIndex, 1))
}

/** Same day-of-month in a month, or null if that date does not exist. */
function dateInMonthOrNull(year: number, monthIndex: number, dayOfMonth: number): string | null {
  const date = new Date(year, monthIndex, dayOfMonth)
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== dayOfMonth) {
    return null
  }
  return toDateOnly(date)
}

function iterateMonthStarts(fromYmd: string, toYmd: string): Array<{ year: number; monthIndex: number }> {
  const start = parseYmd(fromYmd)
  const end = parseYmd(toYmd)
  const months: Array<{ year: number; monthIndex: number }> = []
  let year = start.getFullYear()
  let monthIndex = start.getMonth()
  const endYear = end.getFullYear()
  const endMonth = end.getMonth()
  while (year < endYear || (year === endYear && monthIndex <= endMonth)) {
    months.push({ year, monthIndex })
    monthIndex += 1
    if (monthIndex > 11) {
      monthIndex = 0
      year += 1
    }
  }
  return months
}

export type EventRecurrence =
  | 'none'
  | 'weekly'
  | 'biweekly'
  | 'monthly_first_week'
  | 'monthly_by_date'

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
    serviceImageUrl: null,
    serviceGalleryImages: [],
    spaceGalleryImages: [],
    formTemplateId: null,
    timeMode: row.time_mode,
    staffId: row.staff_id,
    staffDisplayName: row.staff_display_name,
    attendeeUserId: row.attendee_user_id,
    attendeeDisplayName: row.attendee_display_name,
    attendeeEmail: row.attendee_email,
    spaceId: row.space_id,
    spaceName: row.space_name,
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

function firstGalleryUrl(images: EventGalleryImage[] | null | undefined): string | null {
  const url = images?.[0]?.url
  return typeof url === 'string' && url.trim() ? url : null
}

function normalizeGalleryImages(
  images: { mediaId: string; url: string }[] | null | undefined,
): EventGalleryImage[] {
  if (!Array.isArray(images)) return []
  return images
    .filter(
      (entry): entry is EventGalleryImage =>
        Boolean(entry) &&
        typeof entry === 'object' &&
        typeof entry.mediaId === 'string' &&
        typeof entry.url === 'string',
    )
    .map((entry) => ({ ...entry, url: rewriteMediaFileUrl(entry.url) }))
}

/**
 * Resolve effective galleries for catalog entity ids (company gallery, else linked library inherit).
 */
async function resolveCatalogGalleries(
  companyId: string,
  kind: 'services' | 'spaces',
  ids: string[],
): Promise<Map<string, EventGalleryImage[]>> {
  const unique = [...new Set(ids.filter(Boolean))]
  const galleryById = new Map<string, EventGalleryImage[]>()
  if (unique.length === 0) return galleryById

  const rows = await catalogRepo.findByIds(companyId, kind, unique)
  const libraryIdsNeeded: string[] = []
  const entityIdToLibraryId = new Map<string, string>()

  for (const row of rows) {
    const mapped = catalogRepo.mapCatalogRow(kind, row) as {
      id: string
      bindingMode: 'linked' | 'forked' | 'custom'
      libraryEntityId: string | null
      galleryImages: EventGalleryImage[] | null
    }
    if (mapped.bindingMode === 'linked' && mapped.libraryEntityId && mapped.galleryImages == null) {
      libraryIdsNeeded.push(mapped.libraryEntityId)
      entityIdToLibraryId.set(mapped.id, mapped.libraryEntityId)
      galleryById.set(mapped.id, [])
      continue
    }
    galleryById.set(mapped.id, normalizeGalleryImages(mapped.galleryImages))
  }

  if (libraryIdsNeeded.length > 0) {
    try {
      const libraryItems = await listLibraryItemsByIds(kind, libraryIdsNeeded)
      const libraryById = new Map(libraryItems.map((item) => [item.id, item]))
      for (const [entityId, libraryId] of entityIdToLibraryId) {
        const lib = libraryById.get(libraryId)
        galleryById.set(entityId, normalizeGalleryImages(lib?.galleryImages))
      }
    } catch {
      // Keep empty galleries when Data library is unreachable.
    }
  }

  return galleryById
}

async function resolveServiceFormTemplateIds(
  companyId: string,
  serviceIds: string[],
): Promise<Map<string, string | null>> {
  const unique = [...new Set(serviceIds.filter(Boolean))]
  const formByServiceId = new Map<string, string | null>()
  if (unique.length === 0) return formByServiceId

  const rows = await catalogRepo.findByIds(companyId, 'services', unique)
  for (const row of rows) {
    const mapped = catalogRepo.mapCatalogRow('services', row) as {
      id: string
      formTemplateId?: string | null
    }
    formByServiceId.set(mapped.id, mapped.formTemplateId ?? null)
  }
  return formByServiceId
}

/** Resolve service/space galleries for event list/detail (company gallery, else linked library). */
async function enrichEventsWithServiceImages(
  companyId: string,
  events: CompanyEventDto[],
): Promise<CompanyEventDto[]> {
  if (events.length === 0) return events

  const serviceIds = events.map((e) => e.serviceId)
  const spaceIds = events.map((e) => e.spaceId).filter((id): id is string => Boolean(id))

  const [serviceGalleries, spaceGalleries, formByServiceId] = await Promise.all([
    resolveCatalogGalleries(companyId, 'services', serviceIds),
    resolveCatalogGalleries(companyId, 'spaces', spaceIds),
    resolveServiceFormTemplateIds(companyId, serviceIds),
  ])

  return events.map((event) => {
    const serviceGalleryImages = serviceGalleries.get(event.serviceId) ?? []
    const spaceGalleryImages = event.spaceId
      ? (spaceGalleries.get(event.spaceId) ?? [])
      : []
    return {
      ...event,
      serviceGalleryImages,
      spaceGalleryImages,
      serviceImageUrl: firstGalleryUrl(serviceGalleryImages),
      formTemplateId: formByServiceId.get(event.serviceId) ?? null,
    }
  })
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

type SpaceInfo = {
  id: string
  name: string
}

async function loadSpace(
  companyId: string,
  spaceId: string,
  accessToken?: string,
): Promise<SpaceInfo> {
  const row = await catalogRepo.findById(companyId, 'spaces', spaceId)
  if (!row) throw serviceError('Space not found', 404)
  const mapped = catalogRepo.mapCatalogRow('spaces', row) as {
    id: string
    name: string | null
    bindingMode: 'linked' | 'forked' | 'custom'
    libraryEntityId: string | null
    payload: { name?: string } | null
  }

  const payloadName = mapped.payload?.name?.trim()
  const columnName = mapped.name?.trim()
  if (columnName || payloadName) {
    return {
      id: mapped.id,
      name: columnName || payloadName || 'Space',
    }
  }

  if (mapped.bindingMode === 'linked' && mapped.libraryEntityId) {
    if (!accessToken) {
      throw serviceError('Linked space requires an authenticated Data library lookup', 400)
    }
    try {
      const library = await getLibraryCatalogItem(
        'spaces',
        mapped.libraryEntityId,
        accessToken,
      )
      if (!library) throw serviceError('Linked library space not found', 404)
      return {
        id: mapped.id,
        name: library.name,
      }
    } catch (err) {
      if ((err as Error & { statusCode?: number }).statusCode) throw err
      throw serviceError(
        err instanceof Error ? err.message : 'Failed to load linked library space',
        502,
      )
    }
  }

  throw serviceError('Space catalog data is incomplete', 400)
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

async function resolveSpace(
  timeMode: 'duration' | 'window',
  companyId: string,
  spaceId: string | null | undefined,
  accessToken?: string,
): Promise<{ space_id: string | null; space_name: string | null }> {
  if (timeMode === 'duration') {
    return { space_id: null, space_name: null }
  }
  const id = spaceId?.trim()
  if (!id) {
    throw serviceError('Space is required for Specific time services', 400)
  }
  const space = await loadSpace(companyId, id, accessToken)
  return { space_id: space.id, space_name: space.name }
}

export function expandOccurrences(
  event: CompanyEventDto,
  fromYmd: string,
  toYmd: string,
): CompanyEventOccurrenceDto[] {
  const seriesStart = event.startsOn
  const seriesEnd =
    event.recurrenceUntil ??
    (event.recurrence === 'none' ? event.startsOn : toYmd)
  const rangeStart = seriesStart > fromYmd ? seriesStart : fromYmd
  const rangeEnd = seriesEnd < toYmd ? seriesEnd : toYmd
  if (rangeStart > rangeEnd) return []

  if (event.recurrence === 'none') {
    if (seriesStart >= fromYmd && seriesStart <= toYmd && seriesStart <= seriesEnd) {
      return [toOccurrence(event, seriesStart)]
    }
    return []
  }

  if (event.recurrence === 'monthly_first_week') {
    const weekday =
      event.weekdays.length > 0 ? event.weekdays[0]! : weekdayOfYmd(seriesStart)
    const results: CompanyEventOccurrenceDto[] = []
    for (const { year, monthIndex } of iterateMonthStarts(seriesStart, seriesEnd)) {
      const occurrence = firstWeekDateInMonth(year, monthIndex, weekday)
      if (occurrence >= rangeStart && occurrence <= rangeEnd && occurrence >= seriesStart) {
        results.push(toOccurrence(event, occurrence))
      }
    }
    return results
  }

  if (event.recurrence === 'monthly_by_date') {
    const dayOfMonth = dayOfMonthOfYmd(seriesStart)
    const results: CompanyEventOccurrenceDto[] = []
    for (const { year, monthIndex } of iterateMonthStarts(seriesStart, seriesEnd)) {
      const occurrence = dateInMonthOrNull(year, monthIndex, dayOfMonth)
      if (
        occurrence &&
        occurrence >= rangeStart &&
        occurrence <= rangeEnd &&
        occurrence >= seriesStart
      ) {
        results.push(toOccurrence(event, occurrence))
      }
    }
    return results
  }

  // weekly / biweekly — walk days in range matching weekdays
  const weekdays =
    event.weekdays.length > 0 ? new Set(event.weekdays) : new Set([weekdayOfYmd(seriesStart)])
  const results: CompanyEventOccurrenceDto[] = []
  let cursor = seriesStart
  while (cursor <= seriesEnd && cursor <= toYmd) {
    if (cursor >= fromYmd && weekdays.has(weekdayOfYmd(cursor))) {
      if (event.recurrence === 'biweekly' && weeksBetween(seriesStart, cursor) % 2 !== 0) {
        cursor = addDaysYmd(cursor, 1)
        continue
      }
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
  opts: {
    q?: string
    page?: number
    pageSize?: number
    from?: string
    to?: string
    viewer: EventViewer
  },
): Promise<{
  items: CompanyEventDto[] | CompanyEventOccurrenceDto[]
  total: number
  page: number
  pageSize: number
  mode: 'series' | 'occurrences'
}> {
  const rows =
    opts.viewer.role === 'member'
      ? await eventRepo.listEventsForMember(companyId, opts.viewer.userId)
      : await eventRepo.listEventsByCompany(companyId)
  let series = await enrichEventsWithServiceImages(companyId, rows.map(mapEvent))

  const q = opts.q?.trim().toLowerCase()
  if (q) {
    series = series.filter(
      (e) =>
        e.serviceName.toLowerCase().includes(q) ||
        e.staffDisplayName.toLowerCase().includes(q) ||
        (e.attendeeDisplayName?.toLowerCase().includes(q) ?? false) ||
        (e.spaceName?.toLowerCase().includes(q) ?? false),
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

async function enrichEventsAcrossCompanies(events: CompanyEventDto[]): Promise<CompanyEventDto[]> {
  if (events.length === 0) return events
  const byCompany = new Map<string, CompanyEventDto[]>()
  for (const event of events) {
    const list = byCompany.get(event.companyId) ?? []
    list.push(event)
    byCompany.set(event.companyId, list)
  }
  const enriched: CompanyEventDto[] = []
  for (const [companyId, companyEvents] of byCompany) {
    enriched.push(...(await enrichEventsWithServiceImages(companyId, companyEvents)))
  }
  // Preserve original order
  const byId = new Map(enriched.map((e) => [e.id, e]))
  return events.map((e) => byId.get(e.id) ?? e)
}

/**
 * Default User personal calendar: events where the user is the attendee
 * or holds a session token (any company).
 */
export async function listMyBookedEvents(
  userId: string,
  opts: { q?: string; page?: number; pageSize?: number; from?: string; to?: string },
): Promise<{
  items: CompanyEventDto[] | CompanyEventOccurrenceDto[]
  total: number
  page: number
  pageSize: number
  mode: 'series' | 'occurrences'
}> {
  const rows = await eventRepo.listEventsForUserBookings(userId)
  let series = await enrichEventsAcrossCompanies(rows.map(mapEvent))

  const q = opts.q?.trim().toLowerCase()
  if (q) {
    series = series.filter(
      (e) =>
        e.serviceName.toLowerCase().includes(q) ||
        e.staffDisplayName.toLowerCase().includes(q) ||
        (e.attendeeDisplayName?.toLowerCase().includes(q) ?? false) ||
        (e.spaceName?.toLowerCase().includes(q) ?? false),
    )
  }

  if (opts.from && opts.to) {
    const occurrences: CompanyEventOccurrenceDto[] = []
    for (const event of series) {
      const expanded = expandOccurrences(event, opts.from, opts.to)
      if (event.attendeeUserId === userId) {
        occurrences.push(...expanded)
        continue
      }
      const tokenDates = new Set(
        await sessionTokenRepo.listOccurrenceDatesForUserEvent(userId, event.id),
      )
      occurrences.push(...expanded.filter((o) => tokenDates.has(o.occurrenceDate)))
    }
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

export async function getMyBookedEvent(userId: string, eventId: string): Promise<CompanyEventDto> {
  const row = await eventRepo.findEventByIdAnyCompany(eventId)
  if (!row) throw serviceError('Event not found', 404)
  const allowed = await eventRepo.userCanAccessBookedEvent(userId, row)
  if (!allowed) throw serviceError('Event not found', 404)
  const [enriched] = await enrichEventsWithServiceImages(row.company_id, [mapEvent(row)])
  const event = enriched!
  if (event.timeMode !== 'window') {
    return event
  }
  const tokenOccurrenceDates = await sessionTokenRepo.listOccurrenceDatesForUserEvent(
    userId,
    eventId,
  )
  return { ...event, tokenOccurrenceDates }
}

export async function getMyBookedSessionDetail(
  userId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionDetailDto> {
  const event = await getMyBookedEvent(userId, eventId)
  const matches = expandOccurrences(event, occurrenceDate, occurrenceDate)
  if (matches.length === 0) {
    throw serviceError('This date is not part of the event series', 400)
  }
  if (event.attendeeUserId !== userId) {
    const tokenDates = await sessionTokenRepo.listOccurrenceDatesForUserEvent(userId, eventId)
    if (!tokenDates.includes(occurrenceDate)) {
      throw serviceError('Event not found', 404)
    }
  }
  const detail = await buildSessionDetail(event.companyId, eventId, occurrenceDate)
  return {
    run: detail.run,
    items: detail.items.filter((token) => token.userId === userId),
    queue: computeSessionQueueLabels(detail.items, detail.run),
  }
}

export async function getCompanyEvent(
  companyId: string,
  eventId: string,
  viewer?: EventViewer,
): Promise<CompanyEventDto> {
  const row = await eventRepo.findEventById(companyId, eventId)
  if (!row) throw serviceError('Event not found', 404)
  if (viewer?.role === 'member') {
    const allowed = await eventRepo.memberCanAccessEvent(companyId, viewer.userId, row)
    if (!allowed) throw serviceError('Event not found', 404)
  }
  const [enriched] = await enrichEventsWithServiceImages(companyId, [mapEvent(row)])
  return enriched!
}

function normalizeEventSchedule(
  timeMode: 'duration' | 'window',
  startsOn: string,
  bodyWeekdays: number[] | undefined,
  recurrence: EventRecurrence | undefined,
  recurrenceUntil: string | null | undefined,
): {
  weekdays: number[]
  recurrence: EventRecurrence
  recurrenceUntil: string
} {
  if (timeMode === 'window') {
    const weekdays = [...new Set(bodyWeekdays ?? [])].sort((a, b) => a - b)
    if (weekdays.length === 0) {
      throw serviceError('Select at least one weekday', 400)
    }
    const resolvedRecurrence = recurrence ?? 'weekly'
    if (resolvedRecurrence !== 'weekly') {
      throw serviceError('Specific time events only support weekly recurrence', 400)
    }
    if (!recurrenceUntil) {
      throw serviceError('End date is required', 400)
    }
    if (recurrenceUntil < startsOn) {
      throw serviceError('End date must be on or after the start date', 400)
    }
    return { weekdays, recurrence: 'weekly', recurrenceUntil }
  }

  const resolvedRecurrence = recurrence ?? 'none'
  const startWeekday = weekdayOfYmd(startsOn)
  let weekdays = [...new Set(bodyWeekdays ?? [])].sort((a, b) => a - b)

  if (resolvedRecurrence === 'monthly_by_date') {
    weekdays = weekdays.length > 0 ? weekdays : [startWeekday]
  } else if (weekdays.length === 0) {
    weekdays = [startWeekday]
  } else if (
    resolvedRecurrence === 'none' ||
    resolvedRecurrence === 'weekly' ||
    resolvedRecurrence === 'biweekly' ||
    resolvedRecurrence === 'monthly_first_week'
  ) {
    // Duration series use a single weekday derived from the start date.
    weekdays = [startWeekday]
  }

  let until = recurrenceUntil ?? null
  if (resolvedRecurrence === 'none') {
    until = startsOn
  } else if (!until) {
    throw serviceError('End date is required', 400)
  }
  if (until < startsOn) {
    throw serviceError('End date must be on or after the start date', 400)
  }

  return { weekdays, recurrence: resolvedRecurrence, recurrenceUntil: until }
}

export async function createCompanyEvent(
  companyId: string,
  body: CreateCompanyEventBody,
  options?: { accessToken?: string },
): Promise<CompanyEventDto> {
  const service = await loadService(companyId, body.service_id, options?.accessToken)
  const { staff, schedules } = await loadStaffWithSchedule(companyId, body.staff_id)
  const times = resolveTimes(service, body.start_time)
  const schedule = normalizeEventSchedule(
    service.timeMode,
    body.starts_on,
    body.weekdays,
    body.recurrence,
    body.recurrence_until,
  )
  assertStaffWorksOnWeekdays(schedules, schedule.weekdays, times.startTime, times.endTime)
  const attendee = resolveAttendee(service.timeMode, body)
  const space = await resolveSpace(
    service.timeMode,
    companyId,
    body.space_id,
    options?.accessToken,
  )

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
    space_id: space.space_id,
    space_name: space.space_name,
    starts_on: body.starts_on,
    start_time: times.startTime,
    end_time: times.endTime,
    weekdays: schedule.weekdays,
    recurrence: schedule.recurrence,
    recurrence_until: schedule.recurrenceUntil,
  })
  const created = await getCompanyEvent(companyId, id)
  if (created.timeMode === 'duration' && service.durationMinutes) {
    notifyAppointmentBooked({
      companyId,
      event: created,
      durationMinutes: service.durationMinutes,
    })
  }
  return created
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

  const service = await loadService(companyId, serviceId, options?.accessToken)
  const { staff, schedules } = await loadStaffWithSchedule(companyId, staffId)
  const times = resolveTimes(
    service,
    body.start_time ?? normalizeTime(existing.start_time) ?? undefined,
  )

  const schedule = normalizeEventSchedule(
    service.timeMode,
    startsOn,
    body.weekdays ?? mappedExisting.weekdays,
    body.recurrence ?? mappedExisting.recurrence,
    body.recurrence_until !== undefined
      ? body.recurrence_until
      : mappedExisting.recurrenceUntil,
  )
  assertStaffWorksOnWeekdays(schedules, schedule.weekdays, times.startTime, times.endTime)

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

  const spaceIdForResolve =
    body.space_id !== undefined ? body.space_id : existing.space_id
  const space = await resolveSpace(
    service.timeMode,
    companyId,
    spaceIdForResolve,
    options?.accessToken,
  )

  await eventRepo.updateEvent(companyId, eventId, {
    service_id: service.id,
    service_name: service.name,
    time_mode: service.timeMode,
    staff_id: staff.id,
    staff_display_name: staff.display_name,
    attendee_user_id: attendee.attendee_user_id,
    attendee_display_name: attendee.attendee_display_name,
    attendee_email: attendee.attendee_email,
    space_id: space.space_id,
    space_name: space.space_name,
    starts_on: startsOn,
    start_time: times.startTime,
    end_time: times.endTime,
    weekdays: schedule.weekdays,
    recurrence: schedule.recurrence,
    recurrence_until: schedule.recurrenceUntil,
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
    status: row.status,
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    userEmail: row.user_email,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function mapSessionRun(row: sessionRunRepo.CompanyEventSessionRunRow): SessionRunDto {
  return {
    id: row.id,
    companyId: row.company_id,
    eventId: row.event_id,
    occurrenceDate: toDateOnly(row.occurrence_date),
    status: row.status,
    currentTokenId: row.current_token_id,
    startedAt: row.started_at ? row.started_at.toISOString() : null,
    startedByUserId: row.started_by_user_id,
    endedAt: row.ended_at ? row.ended_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function assertValidSessionOccurrence(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  viewer?: EventViewer,
): Promise<CompanyEventDto> {
  const event = await getCompanyEvent(companyId, eventId, viewer)
  const matches = expandOccurrences(event, occurrenceDate, occurrenceDate)
  if (matches.length === 0) {
    throw serviceError('This date is not part of the event series', 400)
  }
  return event
}

async function getOrCreateSessionRun(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<sessionRunRepo.CompanyEventSessionRunRow> {
  const existing = await sessionRunRepo.findRunForSession(companyId, eventId, occurrenceDate)
  if (existing) return existing
  try {
    return await sessionRunRepo.insertRun({
      id: nanoid(),
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      status: 'scheduled',
    })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'ER_DUP_ENTRY') {
      const raced = await sessionRunRepo.findRunForSession(companyId, eventId, occurrenceDate)
      if (raced) return raced
    }
    throw err
  }
}

async function buildSessionDetail(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionDetailDto> {
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)
  const rows = await sessionTokenRepo.listTokensForSession(companyId, eventId, occurrenceDate)
  return {
    run: mapSessionRun(run),
    items: rows.map(mapSessionToken),
  }
}

function assertWindowTokensAllowed(event: CompanyEventDto): void {
  if (event.timeMode === 'duration') {
    throw serviceError(
      'Tokens are only available for Specific time (window) sessions',
      400,
    )
  }
}

export async function getSessionDetail(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  viewer?: EventViewer,
): Promise<SessionDetailDto> {
  await assertValidSessionOccurrence(companyId, eventId, occurrenceDate, viewer)
  return buildSessionDetail(companyId, eventId, occurrenceDate)
}

export async function listSessionTokens(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  viewer?: EventViewer,
): Promise<SessionTokenDto[]> {
  const detail = await getSessionDetail(companyId, eventId, occurrenceDate, viewer)
  return detail.items
}

export async function createSessionToken(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  body: CreateSessionTokenBody,
): Promise<SessionTokenDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  assertWindowTokensAllowed(event)

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

    await roleRepo.ensureCompanyCustomerMemberRole(userId, companyId, nanoid())

    const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)
    if (run.status === 'started' && !run.current_token_id) {
      const serving = await sessionTokenRepo.findServingToken(
        companyId,
        eventId,
        occurrenceDate,
      )
      if (!serving) {
        await sessionTokenRepo.updateTokenStatus(row.id, 'serving')
        await sessionRunRepo.updateRun(run.id, { current_token_id: row.id })
        const updated = await sessionTokenRepo.findTokenById(companyId, row.id)
        if (updated) {
          const token = mapSessionToken(updated)
          notifySessionTokenIssued({
            companyId,
            event,
            token,
            preferredEmail: body.user_email,
          })
          notifySessionTokenCalled({ companyId, event, token })
          return token
        }
      }
    }

    const token = mapSessionToken(row)
    notifySessionTokenIssued({
      companyId,
      event,
      token,
      preferredEmail: body.user_email,
    })
    return token
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
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  assertWindowTokensAllowed(event)
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

export async function backfillSessionTokenMemberRoles(): Promise<{
  total: number
  ensured: number
  failed: number
}> {
  const rows = await sessionTokenRepo.listDistinctTokenHolders()
  let ensured = 0
  let failed = 0
  for (const row of rows) {
    try {
      await roleRepo.ensureCompanyCustomerMemberRole(row.user_id, row.company_id, nanoid())
      ensured += 1
    } catch (err) {
      failed += 1
      console.error(
        `Failed to ensure member role for session token holder (user=${row.user_id}, company=${row.company_id})`,
        err,
      )
    }
  }
  return { total: rows.length, ensured, failed }
}

export async function startSession(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  startedByUserId: string,
): Promise<SessionDetailDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)

  if (run.status === 'ended') {
    throw serviceError('This session has already ended', 409)
  }

  if (run.status === 'started') {
    return buildSessionDetail(companyId, eventId, occurrenceDate)
  }

  let currentTokenId: string | null = null
  let firstServingToken: SessionTokenDto | null = null
  const firstWaiting = await sessionTokenRepo.findFirstWaitingToken(
    companyId,
    eventId,
    occurrenceDate,
  )
  if (firstWaiting) {
    await sessionTokenRepo.updateTokenStatus(firstWaiting.id, 'serving')
    currentTokenId = firstWaiting.id
    firstServingToken = mapSessionToken({ ...firstWaiting, status: 'serving' })
  }

  await sessionRunRepo.updateRun(run.id, {
    status: 'started',
    current_token_id: currentTokenId,
    started_at: new Date(),
    started_by_user_id: startedByUserId,
    ended_at: null,
  })

  const tokens = await sessionTokenRepo.listTokensForSession(companyId, eventId, occurrenceDate)
  notifySessionStarted({
    companyId,
    event,
    tokens: tokens.map(mapSessionToken),
  })
  if (firstServingToken) {
    notifySessionTokenCalled({ companyId, event, token: firstServingToken })
  }

  return buildSessionDetail(companyId, eventId, occurrenceDate)
}

export async function callNextSessionToken(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionDetailDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  assertWindowTokensAllowed(event)
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)

  if (run.status !== 'started') {
    throw serviceError('Session must be started before calling next token', 409)
  }

  const serving = await sessionTokenRepo.findServingToken(companyId, eventId, occurrenceDate)
  if (serving) {
    await sessionTokenRepo.updateTokenStatus(serving.id, 'completed')
  }

  const nextWaiting = await sessionTokenRepo.findFirstWaitingToken(
    companyId,
    eventId,
    occurrenceDate,
  )
  if (!nextWaiting) {
    if (!serving) {
      throw serviceError('No waiting tokens to call', 400)
    }
    await sessionRunRepo.updateRun(run.id, { current_token_id: null })
    return buildSessionDetail(companyId, eventId, occurrenceDate)
  }

  await sessionTokenRepo.updateTokenStatus(nextWaiting.id, 'serving')
  await sessionRunRepo.updateRun(run.id, { current_token_id: nextWaiting.id })

  const nextToken = mapSessionToken({ ...nextWaiting, status: 'serving' })
  notifySessionTokenCalled({ companyId, event, token: nextToken })

  return buildSessionDetail(companyId, eventId, occurrenceDate)
}

/** Undo a mistaken call-next. Does not send email/SMS. */
export async function callPreviousSessionToken(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionDetailDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  assertWindowTokensAllowed(event)
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)

  if (run.status !== 'started') {
    throw serviceError('Session must be started before calling previous token', 409)
  }

  const lastCompleted = await sessionTokenRepo.findLastCompletedToken(
    companyId,
    eventId,
    occurrenceDate,
  )
  if (!lastCompleted) {
    throw serviceError('No previous token to return to', 400)
  }

  const serving = await sessionTokenRepo.findServingToken(companyId, eventId, occurrenceDate)
  if (serving) {
    await sessionTokenRepo.updateTokenStatus(serving.id, 'waiting')
  }

  await sessionTokenRepo.updateTokenStatus(lastCompleted.id, 'serving')
  await sessionRunRepo.updateRun(run.id, { current_token_id: lastCompleted.id })

  return buildSessionDetail(companyId, eventId, occurrenceDate)
}

export async function endSession(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionDetailDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)

  if (run.status === 'ended') {
    return buildSessionDetail(companyId, eventId, occurrenceDate)
  }
  if (run.status !== 'started') {
    throw serviceError('Session must be started before it can be ended', 409)
  }

  const tokens = await sessionTokenRepo.listTokensForSession(companyId, eventId, occurrenceDate)

  await sessionTokenRepo.clearServingTokens(companyId, eventId, occurrenceDate)
  await sessionRunRepo.updateRun(run.id, {
    status: 'ended',
    current_token_id: null,
    ended_at: new Date(),
  })

  notifySessionEnded({
    companyId,
    event,
    tokens: tokens.map(mapSessionToken),
  })

  return buildSessionDetail(companyId, eventId, occurrenceDate)
}
