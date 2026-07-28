import { z } from 'zod'

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

export const staffScheduleSchema = z
  .array(staffScheduleDaySchema)
  .length(7)
  .superRefine((days, ctx) => {
    const daySet = new Set(days.map((d) => d.day_of_week))
    if (daySet.size !== 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Schedule must include each day of the week exactly once',
      })
      return
    }
    for (let i = 0; i < 7; i += 1) {
      if (!daySet.has(i)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing day_of_week ${i}`,
        })
      }
    }
    if (!days.some((d) => d.is_working)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one working day',
      })
    }
  })

export const createCompanyStaffBodySchema = z.object({
  user_id: z.string().trim().min(1).max(21),
  display_name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255).nullable().optional(),
  schedule: staffScheduleSchema,
})

export const updateCompanyStaffBodySchema = z.object({
  user_id: z.string().trim().min(1).max(21).optional(),
  display_name: z.string().trim().min(1).max(255).optional(),
  email: z.string().trim().email().max(255).nullable().optional(),
  schedule: staffScheduleSchema.optional(),
})

export type CreateCompanyStaffBody = z.infer<typeof createCompanyStaffBodySchema>
export type UpdateCompanyStaffBody = z.infer<typeof updateCompanyStaffBodySchema>
export type StaffScheduleDay = z.infer<typeof staffScheduleDaySchema>
