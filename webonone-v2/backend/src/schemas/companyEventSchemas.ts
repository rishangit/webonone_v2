import { z } from 'zod'

const timeHhMm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format')

const dateYmd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

export const eventRecurrenceSchema = z.enum([
  'none',
  'weekly',
  'biweekly',
  'monthly_first_week',
  'monthly_by_date',
])

const weekdaysSchema = z
  .array(z.number().int().min(0).max(6))
  .refine((days) => new Set(days).size === days.length, {
    message: 'Weekdays must be unique',
  })

export const createCompanyEventBodySchema = z
  .object({
    service_id: z.string().trim().min(1).max(21),
    staff_id: z.string().trim().min(1).max(21),
    attendee_user_id: z.string().trim().min(1).max(21).nullable().optional(),
    attendee_display_name: z.string().trim().min(1).max(255).nullable().optional(),
    attendee_email: z.string().trim().email().max(255).nullable().optional(),
    /** Required for Specific time (window) services; ignored for duration. */
    space_id: z.string().trim().min(1).max(21).nullable().optional(),
    starts_on: dateYmd,
    /** Required for duration services; ignored for window (taken from service). */
    start_time: timeHhMm.optional(),
    weekdays: weekdaysSchema.default([]),
    recurrence: eventRecurrenceSchema.default('weekly'),
    recurrence_until: dateYmd,
  })
  .superRefine((body, ctx) => {
    if (body.recurrence_until < body.starts_on) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date',
        path: ['recurrence_until'],
      })
    }
    if (body.recurrence === 'none' && body.recurrence_until !== body.starts_on) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Single events must end on the start date',
        path: ['recurrence_until'],
      })
    }
  })

export const updateCompanyEventBodySchema = z
  .object({
    service_id: z.string().trim().min(1).max(21).optional(),
    staff_id: z.string().trim().min(1).max(21).optional(),
    attendee_user_id: z.string().trim().min(1).max(21).nullable().optional(),
    attendee_display_name: z.string().trim().min(1).max(255).nullable().optional(),
    attendee_email: z.string().trim().email().max(255).nullable().optional(),
    space_id: z.string().trim().min(1).max(21).nullable().optional(),
    starts_on: dateYmd.optional(),
    start_time: timeHhMm.optional(),
    weekdays: weekdaysSchema.optional(),
    recurrence: eventRecurrenceSchema.optional(),
    recurrence_until: dateYmd.nullable().optional(),
  })
  .superRefine((body, ctx) => {
    if (body.recurrence_until && body.starts_on && body.recurrence_until < body.starts_on) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date',
        path: ['recurrence_until'],
      })
    }
    if (
      body.recurrence === 'none' &&
      body.recurrence_until &&
      body.starts_on &&
      body.recurrence_until !== body.starts_on
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Single events must end on the start date',
        path: ['recurrence_until'],
      })
    }
  })

export const createSessionTokenBodySchema = z.object({
  user_id: z.string().trim().min(1).max(21),
  user_display_name: z.string().trim().min(1).max(255),
  user_email: z.string().trim().email().max(255).nullable().optional(),
  user_avatar_url: z.string().trim().max(2048).nullable().optional(),
})

/** Self-serve public booking — user id comes from JWT. */
export const bookPublicSessionTokenBodySchema = z.object({
  user_display_name: z.string().trim().min(1).max(255),
  user_email: z.string().trim().email().max(255).nullable().optional(),
  user_avatar_url: z.string().trim().max(2048).nullable().optional(),
})

export const changeSessionScheduleBodySchema = z
  .object({
    delayHours: z.number().int().min(0).max(24),
    delayMinutes: z.number().int().min(0).max(59),
    sendEmail: z.boolean(),
    sendSms: z.boolean(),
  })
  .superRefine((body, ctx) => {
    const total = body.delayHours * 60 + body.delayMinutes
    if (total < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Delay must be at least 1 minute',
        path: ['delayMinutes'],
      })
    }
    if (total > 24 * 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Delay cannot exceed 24 hours',
        path: ['delayHours'],
      })
    }
  })

export type CreateCompanyEventBody = z.infer<typeof createCompanyEventBodySchema>
export type UpdateCompanyEventBody = z.infer<typeof updateCompanyEventBodySchema>
export type CreateSessionTokenBody = z.infer<typeof createSessionTokenBodySchema>
export type BookPublicSessionTokenBody = z.infer<typeof bookPublicSessionTokenBodySchema>
export const reassignSessionStaffBodySchema = z.object({
  staff_id: z.string().trim().min(1).max(21),
})

export type ChangeSessionScheduleBody = z.infer<typeof changeSessionScheduleBodySchema>
export type ReassignSessionStaffBody = z.infer<typeof reassignSessionStaffBodySchema>
