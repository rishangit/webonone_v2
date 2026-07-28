import { z } from 'zod'

/** UI form values for add/edit attribute value (number or text). */
export const catalogAttributeNumberValueSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, 'Value is required')
    .refine((v) => Number.isFinite(Number(v)), 'Enter a valid number'),
})

export const catalogAttributeTextValueSchema = z.object({
  value: z.string().trim().min(1, 'Value is required'),
})

export type CatalogAttributeNumberValueForm = z.infer<typeof catalogAttributeNumberValueSchema>
export type CatalogAttributeTextValueForm = z.infer<typeof catalogAttributeTextValueSchema>
