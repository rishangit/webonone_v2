import { z } from 'zod'
import { createCatalogBodySchema } from './catalog.schema.js'

export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm')

function refineServiceTime(
  data: {
    time_mode?: 'duration' | 'window'
    duration_minutes?: number | null
    start_time?: string | null
    end_time?: string | null
  },
  ctx: z.RefinementCtx,
  options: { requireMode: boolean },
) {
  if (data.time_mode === undefined) {
    if (
      options.requireMode ||
      data.duration_minutes !== undefined ||
      data.start_time !== undefined ||
      data.end_time !== undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'time_mode is required',
        path: ['time_mode'],
      })
    }
    return
  }

  if (data.time_mode === 'duration') {
    if (data.duration_minutes == null || !Number.isInteger(data.duration_minutes) || data.duration_minutes < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'duration_minutes must be a positive integer',
        path: ['duration_minutes'],
      })
    }
    return
  }

  if (!data.start_time) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'start_time is required',
      path: ['start_time'],
    })
  }
  if (!data.end_time) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'end_time is required',
      path: ['end_time'],
    })
  }
  if (data.start_time && data.end_time && data.end_time <= data.start_time) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'end_time must be after start_time',
      path: ['end_time'],
    })
  }
}

const serviceTimeFieldsSchema = z.object({
  time_mode: z.enum(['duration', 'window']),
  duration_minutes: z.number().int().positive().optional().nullable(),
  start_time: timeOfDaySchema.optional().nullable(),
  end_time: timeOfDaySchema.optional().nullable(),
})

export const createServiceBodySchema = createCatalogBodySchema
  .merge(serviceTimeFieldsSchema)
  .superRefine((data, ctx) => refineServiceTime(data, ctx, { requireMode: true }))

export const updateServiceBodySchema = createCatalogBodySchema
  .partial()
  .extend({
    time_mode: z.enum(['duration', 'window']).optional(),
    duration_minutes: z.number().int().positive().optional().nullable(),
    start_time: timeOfDaySchema.optional().nullable(),
    end_time: timeOfDaySchema.optional().nullable(),
  })
  .superRefine((data, ctx) => refineServiceTime(data, ctx, { requireMode: false }))

export type CreateServiceBody = z.infer<typeof createServiceBodySchema>
export type UpdateServiceBody = z.infer<typeof updateServiceBodySchema>
export type ServiceTimeMode = 'duration' | 'window'
