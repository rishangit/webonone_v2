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
import * as sessionCheckInRepo from '../repositories/companyEventSessionCheckIn.repository.js'
import * as staffRepo from '../repositories/companyStaff.repository.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import {
  effectiveStaffId,
  isRunCancelled,
  loadApprovedLeaveDatesByStaff,
  resolveSessionIssue,
  staffOnApprovedLeave,
  type SessionIssueKind,
} from './sessionOccurrenceIssue.js'
import {
  notifySessionEnded,
  notifySessionScheduleChanged,
  notifySessionStarted,
  notifySessionTokenCalled,
  notifySessionTokenIssued,
} from './sessionTokenNotify.service.js'
import { notifyAppointmentBooked } from './appointmentNotify.service.js'
import {
  buildWorkflowProgress,
  firstWorkflowItemId,
  loadWorkflowStepDefs,
  nextWorkflowState,
  type TokenWorkflowProgressDto,
} from './tokenWorkflowProgress.js'
import { computeWorkflowStepQueuesForService } from './sessionWorkflowQueue.js'
import {
  notifyAppointmentBookedInApp,
  notifySessionEndedInApp,
  notifySessionScheduleChangedInApp,
  notifySessionStartedInApp,
  notifySessionTokenCalledInApp,
} from './inAppNotify.service.js'
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
  /** Company member viewer is assigned staff (series, run, or service workflow). */
  viewerIsAssignedStaff?: boolean
}

export type SessionTokenStatus = 'waiting' | 'serving' | 'completed'
export type SessionRunStatus = 'scheduled' | 'started' | 'ended'

export type SessionScheduleChangeKind = 'delayed' | 'early'

export type CompanyEventOccurrenceDto = CompanyEventDto & {
  occurrenceDate: string
  start: string
  end: string
  title: string
  /** Session run status; `scheduled` when no run row exists yet. */
  runStatus: SessionRunStatus
  /** True when this occurrence has a delayed/overridden start/end on the session run. */
  scheduleChanged: boolean
  /** Relative to series start time when scheduleChanged. */
  scheduleChangeKind: SessionScheduleChangeKind | null
  /** Series start before occurrence override (same as startTime when unchanged). */
  originalStartTime: string
  /** Series end before occurrence override (same as endTime when unchanged). */
  originalEndTime: string
  sessionCancelled: boolean
  effectiveStaffId: string
  effectiveStaffDisplayName: string
  sessionIssue: SessionIssueKind
  /** Personal calendar — viewer is booked for this occurrence and has checked in. */
  viewerCheckedIn?: boolean
}

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
  userAvatarUrl: string | null
  createdAt: string
  updatedAt: string
  workflowProgress: TokenWorkflowProgressDto
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
  /** Occurrence override; null means use parent event times. */
  scheduledStartTime: string | null
  scheduledEndTime: string | null
  createdAt: string
  updatedAt: string
}

export type SessionDetailDto = {
  run: SessionRunDto
  items: SessionTokenDto[]
  /** Effective start for this occurrence (override ?? event). */
  sessionStartTime: string
  /** Effective end for this occurrence (override ?? event). */
  sessionEndTime: string
  sessionCancelled: boolean
  effectiveStaffId: string
  effectiveStaffDisplayName: string
  sessionIssue: SessionIssueKind
  /** Present on personal (/me) session views — queue labels from the full company token list. */
  queue?: {
    prevTokenLabel: string | null
    currentTokenLabel: string | null
    nextTokenLabel: string | null
  }
  /** Per workflow step with session queue — labels from the full company token list. */
  stepQueues?: Record<
    string,
    {
      prevTokenLabel: string | null
      currentTokenLabel: string | null
      nextTokenLabel: string | null
      currentTokenId: string | null
    }
  >
  /** Company member viewer is assigned staff for this occurrence. */
  viewerIsAssignedStaff?: boolean
}

function computeSessionQueueLabels(
  items: SessionTokenDto[],
  run: SessionRunDto,
  checkedInUserIds: Set<string>,
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
    .filter((token) => token.status === 'waiting' && checkedInUserIds.has(token.userId))
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
    runStatus: 'scheduled',
    scheduleChanged: false,
    scheduleChangeKind: null,
    originalStartTime: event.startTime,
    originalEndTime: event.endTime,
    sessionCancelled: false,
    effectiveStaffId: event.staffId,
    effectiveStaffDisplayName: event.staffDisplayName,
    sessionIssue: null,
  }
}

function scheduleChangeKindFor(
  originalStart: string,
  newStart: string,
): SessionScheduleChangeKind | null {
  const delta = timeToMinutes(newStart) - timeToMinutes(originalStart)
  if (delta > 0) return 'delayed'
  if (delta < 0) return 'early'
  return null
}

function applyOccurrenceScheduleOverride(
  item: CompanyEventOccurrenceDto,
  run: sessionRunRepo.CompanyEventSessionRunRow | undefined,
): CompanyEventOccurrenceDto {
  const originalStartTime = item.originalStartTime || item.startTime
  const originalEndTime = item.originalEndTime || item.endTime

  if (!run) {
    return {
      ...item,
      runStatus: 'scheduled',
      scheduleChanged: false,
      scheduleChangeKind: null,
      originalStartTime,
      originalEndTime,
      sessionCancelled: false,
      effectiveStaffId: item.staffId,
      effectiveStaffDisplayName: item.staffDisplayName,
      sessionIssue: null,
    }
  }

  const scheduledStart = normalizeTime(run.scheduled_start_time)
  const scheduledEnd = normalizeTime(run.scheduled_end_time)
  const scheduleChanged = Boolean(scheduledStart && scheduledEnd)
  const startTime = scheduleChanged ? scheduledStart! : originalStartTime
  const endTime = scheduleChanged ? scheduledEnd! : originalEndTime
  const scheduleChangeKind = scheduleChanged
    ? scheduleChangeKindFor(originalStartTime, startTime)
    : null

  return {
    ...item,
    startTime,
    endTime,
    start: `${item.occurrenceDate}T${startTime}:00`,
    end: `${item.occurrenceDate}T${endTime}:00`,
    runStatus: run.status,
    scheduleChanged,
    scheduleChangeKind,
    originalStartTime,
    originalEndTime,
    sessionCancelled: isRunCancelled(run),
    effectiveStaffId: effectiveStaffId(item.staffId, run),
    effectiveStaffDisplayName: item.staffDisplayName,
    sessionIssue: isRunCancelled(run) ? 'cancelled' : null,
  }
}

async function attachOccurrenceRunStatuses(
  occurrences: CompanyEventOccurrenceDto[],
  from: string,
  to: string,
): Promise<CompanyEventOccurrenceDto[]> {
  if (occurrences.length === 0) return occurrences
  const eventIds = [...new Set(occurrences.map((item) => item.id))]
  const runs = await sessionRunRepo.listRunsForEventsInRange(eventIds, from, to)
  const runByKey = new Map(
    runs.map((row) => [`${row.event_id}:${toDateOnly(row.occurrence_date)}`, row]),
  )
  const withSchedule = occurrences.map((item) =>
    applyOccurrenceScheduleOverride(item, runByKey.get(`${item.id}:${item.occurrenceDate}`)),
  )
  const companyId = withSchedule[0]?.companyId
  if (!companyId) return withSchedule

  const staffIds = [...new Set(withSchedule.map((item) => item.effectiveStaffId))]
  const leaveByStaff = await loadApprovedLeaveDatesByStaff(companyId, staffIds, from, to)
  const staffNameById = new Map<string, string>()
  const extraStaffIds = staffIds.filter((id) => !withSchedule.some((item) => item.staffId === id))
  await Promise.all(
    extraStaffIds.map(async (staffId) => {
      const staff = await staffRepo.findStaffById(companyId, staffId)
      if (staff) staffNameById.set(staff.id, staff.display_name)
    }),
  )

  return withSchedule.map((item) => {
    const displayName =
      staffNameById.get(item.effectiveStaffId) ??
      (item.effectiveStaffId === item.staffId ? item.staffDisplayName : item.staffDisplayName)
    const staffOnLeave = staffOnApprovedLeave(
      leaveByStaff,
      item.effectiveStaffId,
      item.occurrenceDate,
    )
    return {
      ...item,
      effectiveStaffDisplayName: displayName,
      sessionIssue: resolveSessionIssue({
        cancelled: item.sessionCancelled,
        staffOnLeave,
      }),
    }
  })
}

function occurrenceCheckInKey(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): string {
  return `${companyId}:${eventId}:${occurrenceDate}`
}

async function attachViewerBookedCheckInStatus(
  occurrences: CompanyEventOccurrenceDto[],
  userId: string,
  tokenDatesByEventId: Map<string, Set<string>>,
  from: string,
  to: string,
): Promise<CompanyEventOccurrenceDto[]> {
  if (occurrences.length === 0) return occurrences

  const subjectKeys = new Set<string>()
  for (const item of occurrences) {
    const isAttendee = item.attendeeUserId === userId
    const hasToken = tokenDatesByEventId.get(item.id)?.has(item.occurrenceDate) ?? false
    if (isAttendee || hasToken) {
      subjectKeys.add(occurrenceCheckInKey(item.companyId, item.id, item.occurrenceDate))
    }
  }
  if (subjectKeys.size === 0) return occurrences

  const eventIds = [...new Set(occurrences.map((item) => item.id))]
  const checkInRows = await sessionCheckInRepo.listCheckInsForUserEventsInRange(
    userId,
    eventIds,
    from,
    to,
  )
  const checkedInKeys = new Set(
    checkInRows.map((row) =>
      occurrenceCheckInKey(row.company_id, row.event_id, toDateOnly(row.occurrence_date)),
    ),
  )

  return occurrences.map((item) => {
    const isAttendee = item.attendeeUserId === userId
    const hasToken = tokenDatesByEventId.get(item.id)?.has(item.occurrenceDate) ?? false
    if (!isAttendee && !hasToken) return item
    const key = occurrenceCheckInKey(item.companyId, item.id, item.occurrenceDate)
    return {
      ...item,
      viewerCheckedIn: checkedInKeys.has(key),
    }
  })
}

export type CatalogSessionItemDto = {
  eventId: string
  occurrenceDate: string
  startTime: string
  endTime: string
  serviceName: string
  companyId: string
  spaceId: string | null
  spaceName: string | null
  scheduleChanged: boolean
  scheduleChangeKind: SessionScheduleChangeKind | null
  originalStartTime: string
  originalEndTime: string
}

export function parseSessionDateRange(
  from?: unknown,
  to?: unknown,
): { from: string; to: string } | null {
  const today = toDateOnly(new Date())
  const start = typeof from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : today
  const end = typeof to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : addDaysYmd(today, 30)
  if (end < start) return null
  return { from: start, to: end }
}

export async function buildWindowSessionItems(
  companyId: string,
  serviceId: string,
  from: string,
  to: string,
): Promise<CatalogSessionItemDto[]> {
  const eventRows = await eventRepo.listWindowEventsByService(companyId, serviceId)
  const occurrences: CompanyEventOccurrenceDto[] = []
  for (const eventRow of eventRows) {
    const event = mapEventRow(eventRow)
    occurrences.push(...expandOccurrences(event, from, to))
  }
  const withOverrides = await attachOccurrenceRunStatuses(occurrences, from, to)
  const blockedServiceDays = new Set(
    withOverrides
      .filter((occurrence) => occurrence.sessionIssue === 'staff_leave')
      .map((occurrence) => `${occurrence.serviceId}:${occurrence.occurrenceDate}`),
  )
  const bookable = withOverrides.filter(
    (occurrence) =>
      !occurrence.sessionIssue &&
      !blockedServiceDays.has(`${occurrence.serviceId}:${occurrence.occurrenceDate}`),
  )
  const items: CatalogSessionItemDto[] = bookable.map((occurrence) => ({
    eventId: occurrence.id,
    occurrenceDate: occurrence.occurrenceDate,
    startTime: occurrence.startTime,
    endTime: occurrence.endTime,
    serviceName: occurrence.serviceName,
    companyId: occurrence.companyId,
    spaceId: occurrence.spaceId,
    spaceName: occurrence.spaceName,
    scheduleChanged: occurrence.scheduleChanged,
    scheduleChangeKind: occurrence.scheduleChangeKind,
    originalStartTime: occurrence.originalStartTime,
    originalEndTime: occurrence.originalEndTime,
  }))

  items.sort((a, b) => {
    const byDate = a.occurrenceDate.localeCompare(b.occurrenceDate)
    if (byDate !== 0) return byDate
    return a.startTime.localeCompare(b.startTime)
  })

  return items
}

function memberCanSeeOccurrence(
  item: CompanyEventOccurrenceDto,
  userId: string,
  access: eventRepo.MemberStaffCalendarAccess,
): boolean {
  if (item.attendeeUserId === userId) return true
  if (!access.staffId) return false
  if (access.workflowServiceIds.has(item.serviceId)) return true
  return item.effectiveStaffId === access.staffId
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
    const withStatus = await attachOccurrenceRunStatuses(occurrences, opts.from, opts.to)
    let visible =
      opts.viewer.role === 'company_admin'
        ? withStatus
        : withStatus.filter((item) => !item.sessionIssue)
    if (opts.viewer.role === 'member') {
      const access = await eventRepo.loadMemberStaffCalendarAccess(
        companyId,
        opts.viewer.userId,
      )
      visible = visible.filter((item) =>
        memberCanSeeOccurrence(item, opts.viewer.userId, access),
      )
    }
    return {
      items: visible,
      total: visible.length,
      page: 1,
      pageSize: visible.length || 20,
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
    const tokenDatesByEventId = new Map<string, Set<string>>()
    for (const event of series) {
      const expanded = expandOccurrences(event, opts.from, opts.to)
      if (event.attendeeUserId === userId) {
        occurrences.push(...expanded)
        continue
      }
      const tokenDates = new Set(
        await sessionTokenRepo.listOccurrenceDatesForUserEvent(userId, event.id),
      )
      tokenDatesByEventId.set(event.id, tokenDates)
      occurrences.push(...expanded.filter((o) => tokenDates.has(o.occurrenceDate)))
    }
    occurrences.sort((a, b) => a.start.localeCompare(b.start))
    const withStatus = await attachOccurrenceRunStatuses(occurrences, opts.from, opts.to)
    const withCheckIn = await attachViewerBookedCheckInStatus(
      withStatus,
      userId,
      tokenDatesByEventId,
      opts.from,
      opts.to,
    )
    return {
      items: withCheckIn,
      total: withCheckIn.length,
      page: 1,
      pageSize: withCheckIn.length || 20,
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
  const detail = await decorateSessionDetail(
    event.companyId,
    event,
    occurrenceDate,
    await buildSessionDetail(event.companyId, eventId, occurrenceDate, event),
  )
  const checkIns = await sessionCheckInRepo.listCheckInsForSession(
    event.companyId,
    eventId,
    occurrenceDate,
  )
  const checkedInUserIds = new Set(checkIns.map((row) => row.user_id))
  const catalogService =
    (await catalogRepo.findById(event.companyId, 'services', event.serviceId)) ??
    (await catalogRepo.findByLibraryId(event.companyId, 'services', event.serviceId))
  const catalogServiceId = catalogService ? String(catalogService.id) : event.serviceId
  const workflowItems = await catalogRepo.listWorkflowItems(event.companyId, catalogServiceId)
  const workflowDefs = await loadWorkflowStepDefs(event.companyId, event.serviceId)
  const stepQueues = computeWorkflowStepQueuesForService(
    detail.items,
    workflowItems,
    workflowDefs,
    checkedInUserIds,
  )
  return {
    run: detail.run,
    items: detail.items.filter((token) => token.userId === userId),
    sessionStartTime: detail.sessionStartTime,
    sessionEndTime: detail.sessionEndTime,
    sessionCancelled: detail.sessionCancelled,
    effectiveStaffId: detail.effectiveStaffId,
    effectiveStaffDisplayName: detail.effectiveStaffDisplayName,
    sessionIssue: detail.sessionIssue,
    queue: computeSessionQueueLabels(detail.items, detail.run, checkedInUserIds),
    stepQueues,
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
  if (viewer?.role !== 'member') return enriched!
  return {
    ...enriched!,
    viewerIsAssignedStaff: await eventRepo.memberIsAssignedStaff(
      companyId,
      viewer.userId,
      row,
    ),
  }
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
  if (service.timeMode === 'duration') {
    await assertStaffNotOnLeaveForDates(companyId, staff.id, [body.starts_on])
    await assertServiceDayHasNoStaffLeaveIssue(companyId, service.id, body.starts_on)
  }
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
    void notifyAppointmentBookedInApp({
      companyId,
      eventId: created.id,
      serviceName: created.serviceName,
      staffId: created.staffId,
      attendeeDisplayName: created.attendeeDisplayName,
    }).catch((err) => {
      console.error('[companyEvent] in-app appointment booked notify failed:', err)
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

function mapSessionToken(
  row: sessionTokenRepo.CompanyEventSessionTokenRow,
  workflowProgress: TokenWorkflowProgressDto,
): SessionTokenDto {
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
    userAvatarUrl: row.user_avatar_url,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    workflowProgress,
  }
}

async function mapSessionTokens(
  companyId: string,
  serviceId: string,
  rows: sessionTokenRepo.CompanyEventSessionTokenRow[],
): Promise<SessionTokenDto[]> {
  const defs = await loadWorkflowStepDefs(companyId, serviceId)
  if (rows.length === 0) return []
  const eventId = rows[0]!.event_id
  const occurrenceDate = toDateOnly(rows[0]!.occurrence_date)
  const [run, checkIns] = await Promise.all([
    sessionRunRepo.findRunForSession(companyId, eventId, occurrenceDate),
    sessionCheckInRepo.listCheckInsForSession(companyId, eventId, occurrenceDate),
  ])
  const checkedInUserIds = new Set(checkIns.map((row) => row.user_id))
  const sessionStarted = run?.status === 'started'
  return rows.map((row) =>
    mapSessionToken(
      row,
      buildWorkflowProgress(defs, row, {
        checkedIn: checkedInUserIds.has(row.user_id),
        sessionStarted,
      }),
    ),
  )
}

async function mapSessionTokenWithProgress(
  companyId: string,
  serviceId: string,
  row: sessionTokenRepo.CompanyEventSessionTokenRow,
): Promise<SessionTokenDto> {
  const [dto] = await mapSessionTokens(companyId, serviceId, [row])
  return dto
}

const EMPTY_WORKFLOW_PROGRESS: TokenWorkflowProgressDto = {
  steps: [],
  currentIndex: 0,
  done: false,
}

function mapSessionTokenNotify(
  row: sessionTokenRepo.CompanyEventSessionTokenRow,
): SessionTokenDto {
  return mapSessionToken(row, EMPTY_WORKFLOW_PROGRESS)
}

async function advanceTokenPastCheckIn(
  companyId: string,
  serviceId: string,
  token: sessionTokenRepo.CompanyEventSessionTokenRow,
): Promise<sessionTokenRepo.CompanyEventSessionTokenRow> {
  if (token.workflow_completed_at) return token
  const defs = await loadWorkflowStepDefs(companyId, serviceId)
  const currentId = token.current_workflow_item_id ?? firstWorkflowItemId(defs)
  const current = defs.find((def) => def.id === currentId)
  if (current && current.kind !== 'check_in') return token
  const next = nextWorkflowState(defs, currentId)
  return sessionTokenRepo.updateTokenWorkflow(token.id, next)
}

async function maybeAdvanceTokenPastCheckIn(
  companyId: string,
  serviceId: string,
  eventId: string,
  occurrenceDate: string,
  token: sessionTokenRepo.CompanyEventSessionTokenRow,
): Promise<sessionTokenRepo.CompanyEventSessionTokenRow> {
  const run = await sessionRunRepo.findRunForSession(companyId, eventId, occurrenceDate)
  if (run?.status !== 'started') return token
  return advanceTokenPastCheckIn(companyId, serviceId, token)
}

async function advanceCheckedInTokensPastCheckIn(
  companyId: string,
  event: CompanyEventDto,
  occurrenceDate: string,
): Promise<void> {
  const checkIns = await sessionCheckInRepo.listCheckInsForSession(
    companyId,
    event.id,
    occurrenceDate,
  )
  if (checkIns.length === 0) return
  const checkedIn = new Set(checkIns.map((row) => row.user_id))
  const tokens = await sessionTokenRepo.listTokensForSession(companyId, event.id, occurrenceDate)
  for (const token of tokens) {
    if (checkedIn.has(token.user_id)) {
      await advanceTokenPastCheckIn(companyId, event.serviceId, token)
    }
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
    scheduledStartTime: normalizeTime(row.scheduled_start_time),
    scheduledEndTime: normalizeTime(row.scheduled_end_time),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function resolveEffectiveSessionTimes(
  event: CompanyEventDto,
  scheduledStartTime: string | null | undefined,
  scheduledEndTime: string | null | undefined,
): { sessionStartTime: string; sessionEndTime: string } {
  return {
    sessionStartTime: normalizeTime(scheduledStartTime) ?? event.startTime,
    sessionEndTime: normalizeTime(scheduledEndTime) ?? event.endTime,
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

async function ensureDurationAttendeeToken(
  companyId: string,
  event: CompanyEventDto,
  occurrenceDate: string,
): Promise<void> {
  if (event.timeMode !== 'duration' || !event.attendeeUserId) return
  const existing = await sessionTokenRepo.findTokenByUser(
    companyId,
    event.id,
    occurrenceDate,
    event.attendeeUserId,
  )
  if (existing) return

  const workflowDefs = await loadWorkflowStepDefs(companyId, event.serviceId)
  const nextNumber =
    (await sessionTokenRepo.getMaxTokenNumber(companyId, event.id, occurrenceDate)) + 1
  try {
    await sessionTokenRepo.insertToken({
      id: nanoid(),
      company_id: companyId,
      event_id: event.id,
      occurrence_date: occurrenceDate,
      token_number: nextNumber,
      user_id: event.attendeeUserId,
      user_display_name: event.attendeeDisplayName ?? 'Customer',
      user_email: event.attendeeEmail,
      user_avatar_url: null,
      current_workflow_item_id: firstWorkflowItemId(workflowDefs),
    })
    await roleRepo.ensureCompanyCustomerMemberRole(event.attendeeUserId, companyId, nanoid())
  } catch (err) {
    const raced = await sessionTokenRepo.findTokenByUser(
      companyId,
      event.id,
      occurrenceDate,
      event.attendeeUserId,
    )
    if (raced) return
    throw err
  }
}

async function buildSessionDetail(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  event?: CompanyEventDto,
): Promise<SessionDetailDto> {
  const resolvedEvent = event ?? (await getCompanyEvent(companyId, eventId))
  await ensureDurationAttendeeToken(companyId, resolvedEvent, occurrenceDate)
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)
  const rows = await sessionTokenRepo.listTokensForSession(companyId, eventId, occurrenceDate)
  const times = resolveEffectiveSessionTimes(
    resolvedEvent,
    run.scheduled_start_time,
    run.scheduled_end_time,
  )
  return {
    run: mapSessionRun(run),
    items: await mapSessionTokens(companyId, resolvedEvent.serviceId, rows),
    sessionStartTime: times.sessionStartTime,
    sessionEndTime: times.sessionEndTime,
    sessionCancelled: false,
    effectiveStaffId: resolvedEvent.staffId,
    effectiveStaffDisplayName: resolvedEvent.staffDisplayName,
    sessionIssue: null,
  }
}

async function decorateSessionDetail(
  _companyId: string,
  event: CompanyEventDto,
  occurrenceDate: string,
  detail: SessionDetailDto,
): Promise<SessionDetailDto> {
  const [decorated] = await attachOccurrenceRunStatuses(
    expandOccurrences(event, occurrenceDate, occurrenceDate).map((item) => ({
      ...item,
      startTime: detail.sessionStartTime,
      endTime: detail.sessionEndTime,
    })),
    occurrenceDate,
    occurrenceDate,
  )
  const occurrence = decorated
  return {
    ...detail,
    sessionCancelled: occurrence?.sessionCancelled ?? false,
    effectiveStaffId: occurrence?.effectiveStaffId ?? event.staffId,
    effectiveStaffDisplayName:
      occurrence?.effectiveStaffDisplayName ?? event.staffDisplayName,
    sessionIssue: occurrence?.sessionIssue ?? null,
  }
}

async function assertStaffNotOnLeaveForDates(
  companyId: string,
  staffId: string,
  dates: string[],
): Promise<void> {
  if (dates.length === 0) return
  const from = dates.reduce((a, b) => (a < b ? a : b))
  const to = dates.reduce((a, b) => (a > b ? a : b))
  const leaveByStaff = await loadApprovedLeaveDatesByStaff(companyId, [staffId], from, to)
  const blocked = dates.find((date) => staffOnApprovedLeave(leaveByStaff, staffId, date))
  if (blocked) {
    throw serviceError(`Assigned staff is on approved leave on ${blocked}`, 409)
  }
}

async function assertServiceDayHasNoStaffLeaveIssue(
  companyId: string,
  serviceId: string,
  date: string,
): Promise<void> {
  const eventRows = await eventRepo.listWindowEventsByService(companyId, serviceId)
  const occurrences: CompanyEventOccurrenceDto[] = []
  for (const eventRow of eventRows) {
    occurrences.push(...expandOccurrences(mapEventRow(eventRow), date, date))
  }
  const withIssues = await attachOccurrenceRunStatuses(occurrences, date, date)
  if (withIssues.some((item) => item.sessionIssue === 'staff_leave')) {
    throw serviceError(
      'This service cannot be booked on this date because assigned staff is on leave',
      409,
    )
  }
}

async function assertSessionIsBookable(
  companyId: string,
  event: CompanyEventDto,
  occurrenceDate: string,
): Promise<void> {
  const [occurrence] = await attachOccurrenceRunStatuses(
    expandOccurrences(event, occurrenceDate, occurrenceDate),
    occurrenceDate,
    occurrenceDate,
  )
  if (occurrence?.sessionIssue === 'cancelled') {
    throw serviceError('This session has been cancelled', 409)
  }
  if (occurrence?.sessionIssue === 'staff_leave') {
    throw serviceError('This session is unavailable because assigned staff is on leave', 409)
  }
  await assertServiceDayHasNoStaffLeaveIssue(companyId, event.serviceId, occurrenceDate)
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
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate, viewer)
  const detail = await decorateSessionDetail(
    companyId,
    event,
    occurrenceDate,
    await buildSessionDetail(companyId, eventId, occurrenceDate, event),
  )
  if (viewer?.role === 'member' && detail.sessionIssue) {
    const token = await sessionTokenRepo.findTokenByUser(
      companyId,
      eventId,
      occurrenceDate,
      viewer.userId,
    )
    if (!token) throw serviceError('Event not found', 404)
  }
  if (viewer?.role === 'member') {
    return {
      ...detail,
      viewerIsAssignedStaff: await eventRepo.memberIsAssignedStaff(
        companyId,
        viewer.userId,
        {
          id: event.id,
          staff_id: event.staffId,
          service_id: event.serviceId,
        },
        { effectiveStaffId: detail.effectiveStaffId },
      ),
    }
  }
  return detail
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
  await assertSessionIsBookable(companyId, event, occurrenceDate)
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)
  if (run.status === 'ended') {
    throw serviceError('This session has already ended', 409)
  }

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
    const workflowDefs = await loadWorkflowStepDefs(companyId, event.serviceId)
    const row = await sessionTokenRepo.insertToken({
      id,
      company_id: companyId,
      event_id: eventId,
      occurrence_date: occurrenceDate,
      token_number: nextNumber,
      user_id: userId,
      user_display_name: body.user_display_name.trim(),
      user_email: body.user_email?.trim() || null,
      user_avatar_url: body.user_avatar_url?.trim() || null,
      current_workflow_item_id: firstWorkflowItemId(workflowDefs),
    })

    await roleRepo.ensureCompanyCustomerMemberRole(userId, companyId, nanoid())

    if (run.status === 'started' && !run.current_token_id) {
      const serving = await sessionTokenRepo.findServingToken(
        companyId,
        eventId,
        occurrenceDate,
      )
      const alreadyCheckedIn = await sessionCheckInRepo.findCheckInByUser(
        companyId,
        eventId,
        occurrenceDate,
        userId,
      )
      if (!serving && alreadyCheckedIn) {
        await sessionTokenRepo.updateTokenStatus(row.id, 'serving')
        await sessionRunRepo.updateRun(run.id, { current_token_id: row.id })
        const updated = await sessionTokenRepo.findTokenById(companyId, row.id)
        if (updated) {
          const token = await mapSessionTokenWithProgress(companyId, event.serviceId, updated)
          notifySessionTokenIssued({
            companyId,
            event,
            token,
            preferredEmail: body.user_email,
          })
          notifySessionTokenCalled({ companyId, event, token })
          void notifySessionTokenCalledInApp({
            companyId,
            eventId,
            occurrenceDate,
            serviceName: event.serviceName,
            userId: token.userId,
            tokenNumber: token.tokenNumber,
          }).catch((err) => {
            console.error('[companyEvent] in-app token called notify failed:', err)
          })
          return token
        }
      }
    }

    const token = await mapSessionTokenWithProgress(companyId, event.serviceId, row)
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
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  const row = await sessionTokenRepo.findTokenByUser(
    companyId,
    eventId,
    occurrenceDate,
    userId,
  )
  return row ? mapSessionTokenWithProgress(companyId, event.serviceId, row) : null
}

export async function completeSessionTokenWorkflow(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  tokenId: string,
  viewer?: EventViewer,
): Promise<SessionTokenDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate, viewer)
  const token = await sessionTokenRepo.findTokenById(companyId, tokenId)
  if (
    !token ||
    token.event_id !== eventId ||
    toDateOnly(token.occurrence_date) !== occurrenceDate
  ) {
    throw serviceError('Session token not found', 404)
  }
  if (token.workflow_completed_at) {
    return mapSessionTokenWithProgress(companyId, event.serviceId, token)
  }
  const defs = await loadWorkflowStepDefs(companyId, event.serviceId)
  const currentId = token.current_workflow_item_id ?? firstWorkflowItemId(defs)
  const current = defs.find((def) => def.id === currentId)
  if (current?.kind === 'check_in') {
    const existing = await sessionCheckInRepo.findCheckInByUser(
      companyId,
      eventId,
      occurrenceDate,
      token.user_id,
    )
    if (!existing) {
      await sessionCheckInRepo.insertCheckIn({
        id: nanoid(),
        companyId,
        eventId,
        occurrenceDate,
        userId: token.user_id,
        userDisplayName: token.user_display_name,
        userEmail: token.user_email,
        userAvatarUrl: token.user_avatar_url,
      })
      await maybePromoteCheckedInWaitingToken(companyId, event, occurrenceDate, token.user_id)
    }
    const updated = await maybeAdvanceTokenPastCheckIn(
      companyId,
      event.serviceId,
      eventId,
      occurrenceDate,
      token,
    )
    return mapSessionTokenWithProgress(companyId, event.serviceId, updated)
  }
  const next = nextWorkflowState(defs, currentId)
  const updated = await sessionTokenRepo.updateTokenWorkflow(token.id, next)
  return mapSessionTokenWithProgress(companyId, event.serviceId, updated)
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
  await assertSessionIsBookable(companyId, event, occurrenceDate)
  await ensureDurationAttendeeToken(companyId, event, occurrenceDate)
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
    firstServingToken = mapSessionTokenNotify({ ...firstWaiting, status: 'serving' })
  }

  await sessionRunRepo.updateRun(run.id, {
    status: 'started',
    current_token_id: currentTokenId,
    started_at: new Date(),
    started_by_user_id: startedByUserId,
    ended_at: null,
  })

  await advanceCheckedInTokensPastCheckIn(companyId, event, occurrenceDate)

  const tokens = await sessionTokenRepo.listTokensForSession(companyId, eventId, occurrenceDate)
  notifySessionStarted({
    companyId,
    event,
    tokens: tokens.map(mapSessionTokenNotify),
  })
  void notifySessionStartedInApp({
    companyId,
    eventId,
    occurrenceDate,
    serviceName: event.serviceName,
    attendeeUserId: event.attendeeUserId,
  }).catch((err) => {
    console.error('[companyEvent] in-app session started notify failed:', err)
  })
  if (firstServingToken && event.timeMode !== 'duration') {
    notifySessionTokenCalled({ companyId, event, token: firstServingToken })
    void notifySessionTokenCalledInApp({
      companyId,
      eventId,
      occurrenceDate,
      serviceName: event.serviceName,
      userId: firstServingToken.userId,
      tokenNumber: firstServingToken.tokenNumber,
    }).catch((err) => {
      console.error('[companyEvent] in-app token called notify failed:', err)
    })
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

  const nextToken = mapSessionTokenNotify({ ...nextWaiting, status: 'serving' })
  notifySessionTokenCalled({ companyId, event, token: nextToken })
  void notifySessionTokenCalledInApp({
    companyId,
    eventId,
    occurrenceDate,
    serviceName: event.serviceName,
    userId: nextToken.userId,
    tokenNumber: nextToken.tokenNumber,
  }).catch((err) => {
    console.error('[companyEvent] in-app token called notify failed:', err)
  })

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
    tokens: tokens.map(mapSessionTokenNotify),
  })
  void notifySessionEndedInApp({
    companyId,
    eventId,
    occurrenceDate,
    serviceName: event.serviceName,
    attendeeUserId: event.attendeeUserId,
  }).catch((err) => {
    console.error('[companyEvent] in-app session ended notify failed:', err)
  })

  return buildSessionDetail(companyId, eventId, occurrenceDate, event)
}

const MAX_SESSION_DELAY_MINUTES = 24 * 60

async function assertCanChangeSession(
  companyId: string,
  userId: string,
  role: PlatformRole,
  event: CompanyEventDto,
  occurrenceDate?: string,
): Promise<void> {
  if (role === 'company_admin') return
  if (role === 'member') {
    let effectiveId: string | undefined
    if (occurrenceDate) {
      const run = await sessionRunRepo.findRunForSession(
        companyId,
        event.id,
        occurrenceDate,
      )
      effectiveId = effectiveStaffId(event.staffId, run)
    }
    const assigned = await eventRepo.memberIsAssignedStaff(
      companyId,
      userId,
      {
        id: event.id,
        staff_id: event.staffId,
        service_id: event.serviceId,
      },
      { effectiveStaffId: effectiveId },
    )
    if (assigned) return
  }
  throw serviceError('Only company admins or assigned staff can change this session', 403)
}

export type ChangeSessionResultDto = SessionDetailDto & {
  notifiedCount: number
  emailQueued: number
  smsQueued: number
}

export async function changeSessionSchedule(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  actor: { userId: string; role: PlatformRole },
  body: {
    delayHours: number
    delayMinutes: number
    sendEmail: boolean
    sendSms: boolean
  },
): Promise<ChangeSessionResultDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate, {
    userId: actor.userId,
    role: actor.role,
  })
  await assertCanChangeSession(
    companyId,
    actor.userId,
    actor.role,
    event,
    occurrenceDate,
  )

  const delayTotal = body.delayHours * 60 + body.delayMinutes
  if (delayTotal < 1) {
    throw serviceError('Delay must be at least 1 minute', 400)
  }
  if (delayTotal > MAX_SESSION_DELAY_MINUTES) {
    throw serviceError('Delay cannot exceed 24 hours', 400)
  }

  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)
  if (run.status !== 'scheduled') {
    throw serviceError('Only scheduled sessions can have their time changed', 409)
  }

  const previous = resolveEffectiveSessionTimes(
    event,
    run.scheduled_start_time,
    run.scheduled_end_time,
  )
  const previousStartMinutes = timeToMinutes(previous.sessionStartTime)
  const previousEndMinutes = timeToMinutes(previous.sessionEndTime)
  if (
    previousStartMinutes + delayTotal >= 24 * 60 ||
    previousEndMinutes + delayTotal >= 24 * 60
  ) {
    throw serviceError('Delay would move the session past midnight; choose a shorter delay', 400)
  }

  const newStart = addMinutesToTime(previous.sessionStartTime, delayTotal)
  const newEnd = addMinutesToTime(previous.sessionEndTime, delayTotal)

  await sessionRunRepo.updateRun(run.id, {
    scheduled_start_time: newStart,
    scheduled_end_time: newEnd,
  })

  const tokens = await sessionTokenRepo.listTokensForSession(companyId, eventId, occurrenceDate)
  const tokenDtos = tokens.map(mapSessionTokenNotify)

  let notifiedCount = 0
  let emailQueued = 0
  let smsQueued = 0

  if (body.sendEmail || body.sendSms) {
    const location = event.spaceName?.trim() || '—'
    const result = await notifySessionScheduleChanged({
      companyId,
      event,
      occurrenceDate,
      tokens: tokenDtos,
      attendee:
        tokenDtos.length === 0 && event.attendeeUserId
          ? {
              userId: event.attendeeUserId,
              userDisplayName: event.attendeeDisplayName ?? 'Customer',
              userEmail: event.attendeeEmail,
            }
          : null,
      previousSessionTime: previous.sessionStartTime,
      sessionTime: newStart,
      sessionEndTime: newEnd,
      location,
      sendEmail: body.sendEmail,
      sendSms: body.sendSms,
    })
    notifiedCount = result.notifiedCount
    emailQueued = result.emailQueued
    smsQueued = result.smsQueued
  }

  void notifySessionScheduleChangedInApp({
    companyId,
    eventId,
    occurrenceDate,
    serviceName: event.serviceName,
    attendeeUserId: event.attendeeUserId,
  }).catch((err) => {
    console.error('[companyEvent] in-app schedule changed notify failed:', err)
  })

  const detail = await buildSessionDetail(companyId, eventId, occurrenceDate, event)
  return {
    ...detail,
    notifiedCount,
    emailQueued,
    smsQueued,
  }
}

export async function cancelSessionOccurrence(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionDetailDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)
  if (run.status === 'ended') {
    throw serviceError('Ended sessions cannot be cancelled', 409)
  }
  await sessionRunRepo.updateRun(run.id, { cancelled_at: new Date() })
  return decorateSessionDetail(
    companyId,
    event,
    occurrenceDate,
    await buildSessionDetail(companyId, eventId, occurrenceDate, event),
  )
}

export async function reassignSessionStaff(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  staffId: string,
): Promise<SessionDetailDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate)
  const staff = await staffRepo.findStaffById(companyId, staffId.trim())
  if (!staff) throw serviceError('Staff not found', 404)
  await assertStaffNotOnLeaveForDates(companyId, staff.id, [occurrenceDate])
  const run = await getOrCreateSessionRun(companyId, eventId, occurrenceDate)
  if (run.status === 'ended') {
    throw serviceError('Ended sessions cannot be reassigned', 409)
  }
  await sessionRunRepo.updateRun(run.id, {
    staff_id: staff.id,
    cancelled_at: null,
  })
  return decorateSessionDetail(
    companyId,
    event,
    occurrenceDate,
    await buildSessionDetail(companyId, eventId, occurrenceDate, event),
  )
}

export type SessionCheckInDto = {
  id: string
  userId: string
  userDisplayName: string
  userEmail: string | null
  userAvatarUrl: string | null
  checkedInAt: string
}

export type SessionCheckInsDto = {
  items: SessionCheckInDto[]
  canCheckIn: boolean
  checkedIn: boolean
}

function toCheckInDto(row: sessionCheckInRepo.SessionCheckInRow): SessionCheckInDto {
  const checkedInAt =
    row.checked_in_at instanceof Date
      ? row.checked_in_at.toISOString()
      : new Date(row.checked_in_at).toISOString()
  return {
    id: row.id,
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    userEmail: row.user_email,
    userAvatarUrl: row.user_avatar_url,
    checkedInAt,
  }
}

async function resolveBookedCheckInSubject(
  companyId: string,
  event: CompanyEventDto,
  occurrenceDate: string,
  userId: string,
): Promise<{
  userId: string
  userDisplayName: string
  userEmail: string | null
  userAvatarUrl: string | null
} | null> {
  const token = await sessionTokenRepo.findTokenByUser(
    companyId,
    event.id,
    occurrenceDate,
    userId,
  )
  if (token) {
    return {
      userId: token.user_id,
      userDisplayName: token.user_display_name,
      userEmail: token.user_email,
      userAvatarUrl: token.user_avatar_url,
    }
  }
  if (event.attendeeUserId === userId) {
    return {
      userId,
      userDisplayName: event.attendeeDisplayName?.trim() || 'Member',
      userEmail: event.attendeeEmail,
      userAvatarUrl: null,
    }
  }
  return null
}

async function buildCheckInsDto(
  companyId: string,
  event: CompanyEventDto,
  occurrenceDate: string,
  userId: string,
  options: { selfOnly: boolean },
): Promise<SessionCheckInsDto> {
  const [rows, subject, existing] = await Promise.all([
    sessionCheckInRepo.listCheckInsForSession(companyId, event.id, occurrenceDate),
    resolveBookedCheckInSubject(companyId, event, occurrenceDate, userId),
    sessionCheckInRepo.findCheckInByUser(companyId, event.id, occurrenceDate, userId),
  ])
  const items = options.selfOnly
    ? rows.filter((row) => row.user_id === userId).map(toCheckInDto)
    : rows.map(toCheckInDto)
  return {
    items,
    canCheckIn: Boolean(subject) && !existing,
    checkedIn: Boolean(existing),
  }
}

async function maybePromoteCheckedInWaitingToken(
  companyId: string,
  event: CompanyEventDto,
  occurrenceDate: string,
  userId: string,
): Promise<void> {
  const run = await getOrCreateSessionRun(companyId, event.id, occurrenceDate)
  if (run.status !== 'started') return
  const serving = await sessionTokenRepo.findServingToken(
    companyId,
    event.id,
    occurrenceDate,
  )
  if (serving) return
  const waiting = await sessionTokenRepo.findTokenByUser(
    companyId,
    event.id,
    occurrenceDate,
    userId,
  )
  if (!waiting || waiting.status !== 'waiting') return
  await sessionTokenRepo.updateTokenStatus(waiting.id, 'serving')
  await sessionRunRepo.updateRun(run.id, { current_token_id: waiting.id })
  const token = mapSessionTokenNotify({ ...waiting, status: 'serving' })
  notifySessionTokenCalled({ companyId, event, token })
  void notifySessionTokenCalledInApp({
    companyId,
    eventId: event.id,
    occurrenceDate,
    serviceName: event.serviceName,
    userId: token.userId,
    tokenNumber: token.tokenNumber,
  }).catch((err) => {
    console.error('[companyEvent] in-app token called notify failed:', err)
  })
}

export async function listSessionCheckIns(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  viewer: EventViewer,
): Promise<SessionCheckInsDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate, viewer)
  return buildCheckInsDto(companyId, event, occurrenceDate, viewer.userId, { selfOnly: false })
}

export async function listMySessionCheckIns(
  userId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionCheckInsDto> {
  await getMyBookedSessionDetail(userId, eventId, occurrenceDate)
  const event = await getMyBookedEvent(userId, eventId)
  return buildCheckInsDto(event.companyId, event, occurrenceDate, userId, { selfOnly: true })
}

export async function createSessionCheckIn(
  companyId: string,
  eventId: string,
  occurrenceDate: string,
  viewer: EventViewer,
): Promise<SessionCheckInsDto> {
  const event = await assertValidSessionOccurrence(companyId, eventId, occurrenceDate, viewer)
  const subject = await resolveBookedCheckInSubject(
    companyId,
    event,
    occurrenceDate,
    viewer.userId,
  )
  if (!subject) {
    throw serviceError('Only booked customers can check in to this session', 403)
  }
  const existing = await sessionCheckInRepo.findCheckInByUser(
    companyId,
    eventId,
    occurrenceDate,
    viewer.userId,
  )
  if (!existing) {
    await sessionCheckInRepo.insertCheckIn({
      id: nanoid(),
      companyId,
      eventId,
      occurrenceDate,
      userId: subject.userId,
      userDisplayName: subject.userDisplayName,
      userEmail: subject.userEmail,
      userAvatarUrl: subject.userAvatarUrl,
    })
    await maybePromoteCheckedInWaitingToken(companyId, event, occurrenceDate, subject.userId)
    const token = await sessionTokenRepo.findTokenByUser(
      companyId,
      eventId,
      occurrenceDate,
      subject.userId,
    )
    if (token) {
      await maybeAdvanceTokenPastCheckIn(
        companyId,
        event.serviceId,
        eventId,
        occurrenceDate,
        token,
      )
    }
  }
  return buildCheckInsDto(companyId, event, occurrenceDate, viewer.userId, { selfOnly: false })
}

export async function createMySessionCheckIn(
  userId: string,
  eventId: string,
  occurrenceDate: string,
): Promise<SessionCheckInsDto> {
  await getMyBookedSessionDetail(userId, eventId, occurrenceDate)
  const event = await getMyBookedEvent(userId, eventId)
  const subject = await resolveBookedCheckInSubject(
    event.companyId,
    event,
    occurrenceDate,
    userId,
  )
  if (!subject) {
    throw serviceError('Only booked customers can check in to this session', 403)
  }
  const existing = await sessionCheckInRepo.findCheckInByUser(
    event.companyId,
    eventId,
    occurrenceDate,
    userId,
  )
  if (!existing) {
    await sessionCheckInRepo.insertCheckIn({
      id: nanoid(),
      companyId: event.companyId,
      eventId,
      occurrenceDate,
      userId: subject.userId,
      userDisplayName: subject.userDisplayName,
      userEmail: subject.userEmail,
      userAvatarUrl: subject.userAvatarUrl,
    })
    await maybePromoteCheckedInWaitingToken(
      event.companyId,
      event,
      occurrenceDate,
      subject.userId,
    )
    const token = await sessionTokenRepo.findTokenByUser(
      event.companyId,
      eventId,
      occurrenceDate,
      subject.userId,
    )
    if (token) {
      await maybeAdvanceTokenPastCheckIn(
        event.companyId,
        event.serviceId,
        eventId,
        occurrenceDate,
        token,
      )
    }
  }
  return buildCheckInsDto(event.companyId, event, occurrenceDate, userId, { selfOnly: true })
}
