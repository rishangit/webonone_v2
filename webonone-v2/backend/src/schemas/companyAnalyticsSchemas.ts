import { z } from 'zod'

const ymdDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')

export const analyticsRangeQuerySchema = z
  .object({
    from: ymdDate,
    to: ymdDate,
  })
  .superRefine((query, ctx) => {
    if (query.from > query.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after start date',
        path: ['to'],
      })
    }
  })

export type AnalyticsRangeQuery = z.infer<typeof analyticsRangeQuerySchema>
