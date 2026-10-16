import { z } from 'zod'
import type { CatalogDiscountKind } from '@/features/company-catalog/types/catalogPricing.types'

const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const catalogPriceBodySchema = z.object({
  price: z
    .number({ invalid_type_error: 'Enter a price of 0 or greater' })
    .min(0, 'Enter a price of 0 or greater'),
})

export type CatalogPriceBody = z.infer<typeof catalogPriceBodySchema>

export type CatalogPriceFormState = {
  price: string
}

export const EMPTY_PRICE_FORM: CatalogPriceFormState = {
  price: '',
}

export function toPriceBody(values: CatalogPriceFormState): CatalogPriceBody {
  const trimmed = values.price.trim()
  return { price: trimmed === '' ? Number.NaN : Number(trimmed) }
}

export const catalogDiscountBodySchema = z
  .object({
    percent: z
      .number({ invalid_type_error: 'Enter a percentage greater than 0' })
      .gt(0, 'Enter a percentage greater than 0')
      .max(100, 'Percentage cannot be more than 100'),
    applyWhen: z.enum(['all_time', 'selected_days', 'date_range']),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    startDate: ymdSchema.nullable().optional(),
    endDate: ymdSchema.nullable().optional(),
    applyTo: z.enum(['everyone', 'selected_users']),
    userIds: z.array(z.string().length(21)).max(50).optional(),
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

export type CatalogDiscountFormState = {
  percent: string
  applyWhen: 'all_time' | 'selected_days' | 'date_range'
  weekdays: number[]
  startDate: string
  endDate: string
  applyTo: 'everyone' | 'selected_users'
  userIds: string[]
  applyVariants: 'all' | 'selected'
  variantIds: string[]
}

export const EMPTY_DISCOUNT_FORM: CatalogDiscountFormState = {
  percent: '',
  applyWhen: 'all_time',
  weekdays: [],
  startDate: '',
  endDate: '',
  applyTo: 'everyone',
  userIds: [],
  applyVariants: 'all',
  variantIds: [],
}

export function toDiscountBody(values: CatalogDiscountFormState): CatalogDiscountBody {
  const trimmed = values.percent.trim()
  const percent = trimmed === '' ? Number.NaN : Number(trimmed)
  const selectedDays = values.applyWhen === 'selected_days'
  const dateRange = values.applyWhen === 'date_range'
  return {
    percent,
    applyWhen: values.applyWhen,
    weekdays: selectedDays ? values.weekdays : [],
    startDate: dateRange ? values.startDate || null : null,
    endDate: dateRange ? values.endDate || null : null,
    applyTo: values.applyTo,
    userIds: values.applyTo === 'selected_users' ? values.userIds : [],
    applyVariants: values.applyVariants,
    variantIds: values.applyVariants === 'selected' ? values.variantIds : [],
  }
}

export function catalogDiscountSchemaFor(kind: CatalogDiscountKind) {
  return catalogDiscountBodySchema.superRefine((data, ctx) => {
    if (kind !== 'products') return
    if (data.applyVariants !== 'all' && data.applyVariants !== 'selected') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applyVariants'],
        message: 'Choose which variants this discount applies to',
      })
    }
  })
}
