import { z } from 'zod'

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/)

export const catalogPriceRuleBodySchema = z
  .object({
    price: z
      .number({ invalid_type_error: 'Enter a price of 0 or greater' })
      .min(0, 'Enter a price of 0 or greater'),
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

export type CatalogPriceRuleFormState = {
  price: string
  applyWhen: 'all_time' | 'selected_days'
  weekdays: number[]
  timeScope: 'full_day' | 'specific_time'
  startTime: string
  endTime: string
  applyTo: 'everyone' | 'selected_users'
  userIds: string[]
}

export const EMPTY_PRICE_RULE_FORM: CatalogPriceRuleFormState = {
  price: '',
  applyWhen: 'all_time',
  weekdays: [],
  timeScope: 'full_day',
  startTime: '',
  endTime: '',
  applyTo: 'everyone',
  userIds: [],
}

export function toPriceRuleBody(values: CatalogPriceRuleFormState): CatalogPriceRuleBody {
  const trimmed = values.price.trim()
  const price = trimmed === '' ? Number.NaN : Number(trimmed)
  const selectedDays = values.applyWhen === 'selected_days'
  const specificTime = selectedDays && values.timeScope === 'specific_time'
  return {
    price,
    applyWhen: values.applyWhen,
    weekdays: selectedDays ? values.weekdays : [],
    timeScope: selectedDays ? values.timeScope : undefined,
    startTime: specificTime ? values.startTime.slice(0, 5) || null : null,
    endTime: specificTime ? values.endTime.slice(0, 5) || null : null,
    applyTo: values.applyTo,
    userIds: values.applyTo === 'selected_users' ? values.userIds : [],
  }
}
