import { z } from 'zod'
import type { UserOption } from '@webonone/mobile-ui'
import { dayOfMonthOfYmd, weekdayOfYmd } from '@/features/calendar/utils/dateYmd'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'
import type {
  CompanyEvent,
  CreateCompanyEventBody,
  EventRecurrence,
  EventTimeMode,
  UpdateCompanyEventBody,
} from '@/features/calendar/types/event.types'

export type EventWizardStep = 1 | 2 | 3 | 4

export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const timeHhMm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format')
const dateYmd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

export const DURATION_REPEAT_FREQUENCIES = [
  'weekly',
  'biweekly',
  'monthly_first_week',
  'monthly_by_date',
] as const satisfies readonly EventRecurrence[]

export type DurationRepeatFrequency = (typeof DURATION_REPEAT_FREQUENCIES)[number]

export type EventServiceOption = {
  id: string
  name: string
  timeMode: EventTimeMode
  durationMinutes: number | null
  startTime: string | null
  endTime: string | null
  imageUrl?: string | null
}

export type EventWizardFormValues = {
  service: EventServiceOption | null
  attendee: UserOption | null
  startsOn: string
  startTime: string
  weekdays: number[]
  recurrence: EventRecurrence
  recurrenceUntil: string
}

export const EMPTY_EVENT_WIZARD_VALUES: EventWizardFormValues = {
  service: null,
  attendee: null,
  startsOn: '',
  startTime: '09:00',
  weekdays: [],
  recurrence: 'none',
  recurrenceUntil: '',
}

export const eventWizardStepServiceSchema = z.object({
  service: z.object({ id: z.string().min(1) }, { required_error: 'Select a service' }),
})

export const eventWizardStepAttendeeSchema = z.object({
  attendee: z.object({ id: z.string().min(1) }, { required_error: 'Select an attendee' }),
})

export const eventWizardStepWhenWindowSchema = z
  .object({
    startsOn: dateYmd,
    weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one weekday'),
    recurrenceUntil: dateYmd,
  })
  .superRefine((data, ctx) => {
    if (data.recurrenceUntil < data.startsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date',
        path: ['recurrenceUntil'],
      })
    }
  })

export const eventWizardStepWhenDurationSchema = z
  .object({
    startsOn: dateYmd,
    startTime: timeHhMm,
    recurrence: z.enum(['none', 'weekly', 'biweekly', 'monthly_first_week', 'monthly_by_date']),
    recurrenceUntil: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.recurrence === 'none') return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.recurrenceUntil)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date is required',
        path: ['recurrenceUntil'],
      })
      return
    }
    if (data.recurrenceUntil < data.startsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date',
        path: ['recurrenceUntil'],
      })
    }
  })

export function formatWeekdaysLabel(weekdays: number[]): string {
  return [...weekdays]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d]?.slice(0, 3) ?? `D${d}`)
    .join(', ')
}

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

export function formatRecurrenceLabel(
  recurrence: EventRecurrence,
  opts?: { startsOn?: string; weekdays?: number[] },
): string {
  switch (recurrence) {
    case 'none':
      return 'Single event'
    case 'weekly': {
      const days =
        opts?.weekdays && opts.weekdays.length > 0
          ? formatWeekdaysLabel(opts.weekdays)
          : opts?.startsOn
            ? DAY_LABELS[weekdayOfYmd(opts.startsOn)]?.slice(0, 3)
            : null
      return days ? `Every week on ${days}` : 'Every week'
    }
    case 'biweekly': {
      const day = opts?.startsOn
        ? DAY_LABELS[weekdayOfYmd(opts.startsOn)]?.slice(0, 3)
        : opts?.weekdays?.[0] != null
          ? DAY_LABELS[opts.weekdays[0]]?.slice(0, 3)
          : null
      return day ? `Every 2 weeks on ${day}` : 'Every 2 weeks'
    }
    case 'monthly_first_week': {
      const day = opts?.startsOn ? DAY_LABELS[weekdayOfYmd(opts.startsOn)]?.slice(0, 3) : null
      return day ? `Every month (first week ${day})` : 'Every month (first week)'
    }
    case 'monthly_by_date': {
      const n = opts?.startsOn ? dayOfMonthOfYmd(opts.startsOn) : null
      return n != null ? `Every month on the ${ordinal(n)}` : 'Every month on day of month'
    }
    default:
      return recurrence
  }
}

export function toCreateEventPayload(values: EventWizardFormValues): CreateCompanyEventBody {
  if (!values.service || !values.startsOn) {
    throw new Error('Incomplete event form')
  }

  if (values.service.timeMode === 'window') {
    if (values.weekdays.length === 0 || !values.recurrenceUntil) {
      throw new Error('Select weekdays and an end date')
    }
    return {
      service_id: values.service.id,
      starts_on: values.startsOn,
      weekdays: [...values.weekdays].sort((a, b) => a - b),
      recurrence: 'weekly',
      recurrence_until: values.recurrenceUntil,
    }
  }

  const weekday = weekdayOfYmd(values.startsOn)
  const recurrence = values.recurrence
  const recurrenceUntil = recurrence === 'none' ? values.startsOn : values.recurrenceUntil
  if (!recurrenceUntil) {
    throw new Error('End date is required')
  }

  return {
    service_id: values.service.id,
    starts_on: values.startsOn,
    weekdays: [weekday],
    recurrence,
    recurrence_until: recurrenceUntil,
    start_time: values.startTime,
    attendee_user_id: values.attendee?.id ?? null,
    attendee_display_name: values.attendee?.displayName ?? null,
    attendee_email: values.attendee?.email ?? null,
  }
}

export function toUpdateEventPayload(values: EventWizardFormValues): UpdateCompanyEventBody {
  return toCreateEventPayload(values)
}

export function eventWizardTotalSteps(timeMode?: EventTimeMode | null): number {
  return timeMode === 'duration' ? 4 : 3
}

export function parseEventWizardStep(
  value: string | number | null | undefined,
  maxSteps = 4,
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

export function valuesFromEvent(event: CompanyEvent): EventWizardFormValues {
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
    attendee:
      event.attendeeUserId != null
        ? {
            id: event.attendeeUserId,
            displayName: event.attendeeDisplayName ?? 'Attendee',
            email: event.attendeeEmail ?? '',
          }
        : null,
    startsOn: event.startsOn,
    startTime: event.startTime,
    weekdays: [...event.weekdays],
    recurrence: event.recurrence,
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
  recurrence?: EventRecurrence
  recurrenceUntil: string | null
}): string {
  const recurrence = event.recurrence ?? 'weekly'
  const until = event.recurrenceUntil ? formatCalendarYmd(event.recurrenceUntil) : '—'
  const from = formatCalendarYmd(event.startsOn)
  const time = `${event.startTime}–${event.endTime}`
  if (recurrence === 'none') {
    return `Single · ${from} · ${time}`
  }
  const label = formatRecurrenceLabel(recurrence, {
    startsOn: event.startsOn,
    weekdays: event.weekdays,
  })
  return `${label} · ${from} → ${until} · ${time}`
}

export function mapZodIssuesToFieldErrors(
  issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.filter((p) => typeof p === 'string' || typeof p === 'number').join('.')
    if (key && !errors[key]) errors[key] = issue.message
  }
  return errors
}
