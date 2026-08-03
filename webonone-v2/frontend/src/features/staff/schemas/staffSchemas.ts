import { z } from 'zod'
import type {
  CompanyStaff,
  CreateCompanyStaffBody,
  StaffScheduleDay,
  UpdateCompanyStaffBody,
} from '../types/staff.types'

export type StaffWizardStep = 1 | 2 | 3

export type StaffWizardUser = {
  id: string
  displayName: string
  email: string | null
  avatarUrl: string | null
}

export type StaffWizardFormValues = {
  user: StaffWizardUser | null
  schedule: StaffScheduleDay[]
}

export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const timeHhMm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format')

export const staffScheduleDaySchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    is_working: z.boolean(),
    start_time: timeHhMm.nullable(),
    end_time: timeHhMm.nullable(),
  })
  .superRefine((day, ctx) => {
    if (!day.is_working) return
    if (!day.start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start time is required',
        path: ['start_time'],
      })
    }
    if (!day.end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time is required',
        path: ['end_time'],
      })
    }
    if (day.start_time && day.end_time && day.start_time >= day.end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['end_time'],
      })
    }
  })

export const staffWizardStep1Schema = z.object({
  user: z
    .object({
      id: z.string().min(1),
      displayName: z.string().min(1),
      email: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    })
    .nullable()
    .refine((user) => user != null, { message: 'Select a user' }),
})

export const staffWizardStep2Schema = z
  .object({
    schedule: z.array(staffScheduleDaySchema).length(7),
  })
  .superRefine((data, ctx) => {
    if (!data.schedule.some((day) => day.is_working)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one working day',
        path: ['schedule'],
      })
    }
  })

export function emptyWeekSchedule(): StaffScheduleDay[] {
  return Array.from({ length: 7 }, (_, day_of_week) => ({
    day_of_week,
    is_working: false,
    start_time: null,
    end_time: null,
  }))
}

export const EMPTY_STAFF_WIZARD_VALUES: StaffWizardFormValues = {
  user: null,
  schedule: emptyWeekSchedule(),
}

export function parseStaffWizardStep(value: string | number | null | undefined): StaffWizardStep {
  const n = typeof value === 'number' ? value : Number(value)
  if (n === 1 || n === 2 || n === 3) return n
  return 1
}

export function valuesFromStaff(staff: CompanyStaff): StaffWizardFormValues {
  const byDay = new Map(staff.schedule.map((day) => [day.day_of_week, day]))
  return {
    user: {
      id: staff.userId,
      displayName: staff.displayName,
      email: staff.email,
      avatarUrl: staff.avatarUrl,
    },
    schedule: emptyWeekSchedule().map((day) => {
      const existing = byDay.get(day.day_of_week)
      return existing
        ? {
            day_of_week: existing.day_of_week,
            is_working: existing.is_working,
            start_time: existing.start_time,
            end_time: existing.end_time,
          }
        : day
    }),
  }
}

export function toCreateStaffPayload(values: StaffWizardFormValues): CreateCompanyStaffBody {
  if (!values.user) {
    throw new Error('Select a user')
  }
  return {
    user_id: values.user.id,
    display_name: values.user.displayName,
    email: values.user.email,
    avatar_url: values.user.avatarUrl,
    schedule: values.schedule.map((day) => ({
      day_of_week: day.day_of_week,
      is_working: day.is_working,
      start_time: day.is_working ? day.start_time : null,
      end_time: day.is_working ? day.end_time : null,
    })),
  }
}

export function toUpdateStaffPayload(values: StaffWizardFormValues): UpdateCompanyStaffBody {
  if (!values.user) {
    throw new Error('Select a user')
  }
  return {
    user_id: values.user.id,
    display_name: values.user.displayName,
    email: values.user.email,
    avatar_url: values.user.avatarUrl,
    schedule: values.schedule.map((day) => ({
      day_of_week: day.day_of_week,
      is_working: day.is_working,
      start_time: day.is_working ? day.start_time : null,
      end_time: day.is_working ? day.end_time : null,
    })),
  }
}

export function formatWorkingDaysSummary(schedule: StaffScheduleDay[]): string {
  const working = schedule
    .filter((day) => day.is_working)
    .map((day) => {
      const label = DAY_LABELS[day.day_of_week]?.slice(0, 3) ?? `D${day.day_of_week}`
      if (day.start_time && day.end_time) {
        return `${label} ${day.start_time}–${day.end_time}`
      }
      return label
    })
  return working.length > 0 ? working.join(', ') : 'No working days'
}
