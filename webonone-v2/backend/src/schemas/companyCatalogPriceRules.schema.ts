import { z } from 'zod'

const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const catalogPriceKindSchema = z.enum(['services', 'spaces'])
export type CatalogPriceKind = z.infer<typeof catalogPriceKindSchema>

export const catalogDiscountKindSchema = z.enum(['products', 'services', 'spaces'])
export type CatalogDiscountKind = z.infer<typeof catalogDiscountKindSchema>

export const catalogPriceBodySchema = z.object({
  price: z.number().min(0),
})

export type CatalogPriceBody = z.infer<typeof catalogPriceBodySchema>

export const catalogDiscountBodySchema = z
  .object({
    percent: z.number().gt(0).max(100),
    applyWhen: z.enum(['all_time', 'selected_days', 'date_range']),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    startDate: ymdSchema.nullable().optional(),
    endDate: ymdSchema.nullable().optional(),
    applyTo: z.enum(['everyone', 'selected_users']),
    userIds: z.array(z.string().length(21)).max(50).optional(),
    /** Products only. `all` covers every variant; `selected` uses variantIds. */
    applyVariants: z.enum(['all', 'selected']).optional(),
    variantIds: z.array(z.string().length(21)).max(50).optional(),
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
    }
    if (data.applyWhen === 'date_range') {
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'Start date is required',
        })
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'End date is required',
        })
      }
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'End date must be on or after the start date',
        })
      }
    }
    if (data.applyTo === 'selected_users' && [...new Set(data.userIds ?? [])].length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userIds'],
        message: 'Select at least one user',
      })
    }
    if (data.applyVariants === 'selected' && [...new Set(data.variantIds ?? [])].length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['variantIds'],
        message: 'Select a variant',
      })
    }
  })

export type CatalogDiscountBody = z.infer<typeof catalogDiscountBodySchema>
