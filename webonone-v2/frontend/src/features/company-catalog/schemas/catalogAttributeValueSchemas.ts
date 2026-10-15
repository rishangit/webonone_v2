import { z } from 'zod'

export const catalogAttributeNumberValueSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, 'Value is required')
    .refine((value) => Number.isFinite(Number(value)), 'Enter a valid number'),
})

export const catalogAttributeTextValueSchema = z.object({
  value: z.string().trim().min(1, 'Value is required'),
})
