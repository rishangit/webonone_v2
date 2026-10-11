import { z } from 'zod'

const limitQuantitySchema = z
  .number({ invalid_type_error: 'Enter a valid number' })
  .min(0, 'Must be 0 or greater')
  .max(999_999_999.999, 'Value is too large')

export const productVariantStockLimitsFormSchema = z
  .object({
    minQuantity: z.string(),
    maxQuantity: z.string(),
  })
  .superRefine((data, ctx) => {
    const parseField = (raw: string, path: 'minQuantity' | 'maxQuantity'): number | null => {
      const trimmed = raw.trim()
      if (trimmed === '') return null
      const n = Number(trimmed)
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid number', path: [path] })
        return null
      }
      const parsed = limitQuantitySchema.safeParse(n)
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: parsed.error.issues[0]?.message ?? 'Invalid value',
          path: [path],
        })
        return null
      }
      return parsed.data
    }

    const min = parseField(data.minQuantity, 'minQuantity')
    const max = parseField(data.maxQuantity, 'maxQuantity')
    if (min != null && max != null && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Min cannot exceed max',
        path: ['maxQuantity'],
      })
    }
  })

export type ProductVariantStockLimitsFormValues = z.infer<typeof productVariantStockLimitsFormSchema>

export function stockLimitsToFormValues(
  minQuantity: number | null | undefined,
  maxQuantity: number | null | undefined,
): ProductVariantStockLimitsFormValues {
  return {
    minQuantity: minQuantity != null ? String(minQuantity) : '',
    maxQuantity: maxQuantity != null ? String(maxQuantity) : '',
  }
}

export function formValuesToStockLimitsPayload(values: ProductVariantStockLimitsFormValues): {
  minQuantity: number | null
  maxQuantity: number | null
} {
  const minTrim = values.minQuantity.trim()
  const maxTrim = values.maxQuantity.trim()
  return {
    minQuantity: minTrim === '' ? null : Number(minTrim),
    maxQuantity: maxTrim === '' ? null : Number(maxTrim),
  }
}
