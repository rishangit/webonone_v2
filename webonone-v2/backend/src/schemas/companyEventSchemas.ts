import { z } from 'zod'

const timeHhMm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format')

const dateYmd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

const weekdaysSchema = z
  .array(z.number().int().min(0).max(6))
  .min(1, 'Select at least one weekday')
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
    starts_on: dateYmd,
    /** Required for duration services; ignored for window (taken from service). */
    start_time: timeHhMm.optional(),
    weekdays: weekdaysSchema,
    recurrence: z.enum(['none', 'weekly']).default('weekly'),
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
  })

export const updateCompanyEventBodySchema = z
  .object({
    service_id: z.string().trim().min(1).max(21).optional(),
    staff_id: z.string().trim().min(1).max(21).optional(),
    attendee_user_id: z.string().trim().min(1).max(21).nullable().optional(),
    attendee_display_name: z.string().trim().min(1).max(255).nullable().optional(),
    attendee_email: z.string().trim().email().max(255).nullable().optional(),
    starts_on: dateYmd.optional(),
    start_time: timeHhMm.optional(),
    weekdays: weekdaysSchema.optional(),
    recurrence: z.enum(['none', 'weekly']).optional(),
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
  })

export const createSessionTokenBodySchema = z.object({
  user_id: z.string().trim().min(1).max(21),
  user_display_name: z.string().trim().min(1).max(255),
  user_email: z.string().trim().email().max(255).nullable().optional(),
})

export type CreateCompanyEventBody = z.infer<typeof createCompanyEventBodySchema>
export type UpdateCompanyEventBody = z.infer<typeof updateCompanyEventBodySchema>
export type CreateSessionTokenBody = z.infer<typeof createSessionTokenBodySchema>
