import { z } from 'zod'
import type { UserOption } from '@webonone/ui-kit'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'
import type { CompanyStaff, StaffScheduleDay } from '@/features/staff/types/staff.types'
import type {
  CompanyEvent,
  CreateCompanyEventBody,
  EventTimeMode,
  UpdateCompanyEventBody,
} from '../types/event.types'

/** 1-based wizard step; duration has 5 steps, window has 4. */
export type EventWizardStep = 1 | 2 | 3 | 4 | 5

const timeHhMm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format')
const dateYmd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

export type EventServiceOption = {
  id: string
  name: string
  timeMode: EventTimeMode
  durationMinutes: number | null
  startTime: string | null
  endTime: string | null
}

export type EventWizardFormValues = {
  service: EventServiceOption | null
  staff: CompanyStaff | null
  attendee: UserOption | null
  startsOn: string
  startTime: string
  weekdays: number[]
  recurrenceUntil: string
}

export const EMPTY_EVENT_WIZARD_VALUES: EventWizardFormValues = {
  service: null,
  staff: null,
  attendee: null,
  startsOn: '',
  startTime: '09:00',
  weekdays: [],
  recurrenceUntil: '',
}

export const eventWizardStepServiceSchema = z.object({
  service: z.object({ id: z.string().min(1) }, { required_error: 'Select a service' }),
})

export const eventWizardStepStaffSchema = z.object({
  staff: z.object({ id: z.string().min(1) }, { required_error: 'Select a staff member' }),
})

export const eventWizardStepAttendeeSchema = z.object({
  attendee: z.object({ id: z.string().min(1) }, { required_error: 'Select an attendee' }),
})

export const eventWizardStepWhenSchema = z
  .object({
    startsOn: dateYmd,
    startTime: timeHhMm.optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one weekday'),
    recurrenceUntil: dateYmd,
    timeMode: z.enum(['duration', 'window']),
    staffWorkingWeekdays: z.array(z.number().int().min(0).max(6)),
  })
  .superRefine((data, ctx) => {
    if (data.timeMode === 'duration' && !data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start time is required',
        path: ['startTime'],
      })
    }
    if (data.recurrenceUntil < data.startsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date',
        path: ['recurrenceUntil'],
      })
    }
    const working = new Set(data.staffWorkingWeekdays)
    for (const day of data.weekdays) {
      if (!working.has(day)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selected weekdays must be staff working days',
          path: ['weekdays'],
        })
        break
      }
    }
  })

export function staffWorkingWeekdays(schedule: StaffScheduleDay[]): number[] {
  return schedule.filter((d) => d.is_working).map((d) => d.day_of_week)
}

export function staffHoursForWeekday(
  schedule: StaffScheduleDay[],
  weekday: number,
): { start: string; end: string } | null {
  const day = schedule.find((d) => d.day_of_week === weekday)
  if (!day?.is_working || !day.start_time || !day.end_time) return null
  return { start: day.start_time, end: day.end_time }
}

/** @deprecated Prefer staffHoursForWeekday — kept for callers that still pass a YMD. */
export function isStaffWorkingDay(schedule: StaffScheduleDay[], ymd: string): boolean {
  const date = new Date(`${ymd}T12:00:00`)
  const weekday = date.getDay()
  const day = schedule.find((d) => d.day_of_week === weekday)
  return Boolean(day?.is_working)
}

export function staffHoursForDate(
  schedule: StaffScheduleDay[],
  ymd: string,
): { start: string; end: string } | null {
  const date = new Date(`${ymd}T12:00:00`)
  return staffHoursForWeekday(schedule, date.getDay())
}

export function formatWeekdaysLabel(weekdays: number[]): string {
  return [...weekdays]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d]?.slice(0, 3) ?? `D${d}`)
    .join(', ')
}

export function toCreateEventPayload(values: EventWizardFormValues): CreateCompanyEventBody {
  if (!values.service || !values.staff || !values.startsOn || !values.recurrenceUntil) {
    throw new Error('Incomplete event form')
  }
  if (values.weekdays.length === 0) {
    throw new Error('Select at least one weekday')
  }
  const body: CreateCompanyEventBody = {
    service_id: values.service.id,
    staff_id: values.staff.id,
    starts_on: values.startsOn,
    weekdays: [...values.weekdays].sort((a, b) => a - b),
    recurrence: 'weekly',
    recurrence_until: values.recurrenceUntil,
  }
  if (values.service.timeMode === 'duration') {
    body.start_time = values.startTime
    body.attendee_user_id = values.attendee?.id ?? null
    body.attendee_display_name = values.attendee?.displayName ?? null
    body.attendee_email = values.attendee?.email ?? null
  }
  return body
}

export function toUpdateEventPayload(values: EventWizardFormValues): UpdateCompanyEventBody {
  return toCreateEventPayload(values)
}

export function eventWizardTotalSteps(timeMode: EventTimeMode | null | undefined): number {
  return timeMode === 'window' ? 4 : 5
}

export function parseEventWizardStep(
  value: string | number | null | undefined,
  maxSteps = 5,
): EventWizardStep {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(n) || n < 1) return 1
  return Math.min(n, maxSteps) as EventWizardStep
}

function minutesBetween(start: string, end: string): number | null {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null
  const diff = eh! * 60 + em! - (sh! * 60 + sm!)
  return diff > 0 ? diff : null
}

export function valuesFromEvent(
  event: CompanyEvent,
  staff: CompanyStaff | null,
): EventWizardFormValues {
  const isWindow = event.timeMode === 'window'
  return {
    service: {
      id: event.serviceId,
      name: event.serviceName,
      timeMode: event.timeMode,
      durationMinutes: isWindow ? null : minutesBetween(event.startTime, event.endTime),
      startTime: isWindow ? event.startTime : null,
      endTime: isWindow ? event.endTime : null,
    },
    staff,
    attendee:
      event.attendeeUserId != null
        ? {
            id: event.attendeeUserId,
            displayName: event.attendeeDisplayName ?? 'Attendee',
            email: event.attendeeEmail,
          }
        : null,
    startsOn: event.startsOn,
    startTime: event.startTime,
    weekdays: [...event.weekdays],
    recurrenceUntil: event.recurrenceUntil ?? '',
  }
}

export function formatTimeModeLabel(timeMode: EventTimeMode): string {
  return timeMode === 'window' ? 'Specific time' : 'Duration'
}

export function formatEventWhen(event: {
  startsOn: string
  startTime: string
  endTime: string
  weekdays?: number[]
  recurrenceUntil: string | null
}): string {
  const days =
    event.weekdays && event.weekdays.length > 0
      ? formatWeekdaysLabel(event.weekdays)
      : 'Weekly'
  const until = event.recurrenceUntil ?? '—'
  return `${days} · ${event.startsOn} → ${until} · ${event.startTime}–${event.endTime}`
}
