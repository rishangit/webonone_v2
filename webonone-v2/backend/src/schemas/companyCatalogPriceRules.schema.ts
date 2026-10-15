import { z } from 'zod'

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/)

export const catalogPriceRuleBodySchema = z
  .object({
    price: z.number().min(0),
    applyWhen: z.enum(['all_time', 'selected_days']),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    timeScope: z.enum(['full_day', 'specific_time']).optional(),
    startTime: timeSchema.nullable().optional(),
    endTime: timeSchema.nullable().optional(),
    applyTo: z.enum(['everyone', 'selected_users']),
    userIds: z.array(z.string().length(21)).max(50).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.applyWhen === 'selected_days') {
      const days = [...new Set(data.weekdays ?? [])]
      if (days.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weekdays'],
          message: 'Select at least one day',
        })
      }
      if (data.timeScope !== 'full_day' && data.timeScope !== 'specific_time') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeScope'],
          message: 'Choose full day or a specific time',
        })
      }
      if (data.timeScope === 'specific_time') {
        if (!data.startTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['startTime'],
            message: 'Start time is required',
          })
        }
        if (!data.endTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endTime'],
            message: 'End time is required',
          })
        }
        if (data.startTime && data.endTime && data.endTime <= data.startTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endTime'],
            message: 'End time must be after start time',
          })
        }
      }
    }
    if (data.applyTo === 'selected_users' && [...new Set(data.userIds ?? [])].length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userIds'],
        message: 'Select at least one user',
      })
    }
  })

export type CatalogPriceRuleBody = z.infer<typeof catalogPriceRuleBodySchema>

export const catalogPriceKindSchema = z.enum(['services', 'spaces'])
export type CatalogPriceKind = z.infer<typeof catalogPriceKindSchema>
