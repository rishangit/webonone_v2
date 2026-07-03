import { z } from 'zod'
import { entityStatusSchema } from './tags.schema.js'

export const createUnitBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).optional().nullable(),
    symbol: z.string().trim().min(1).max(32),
    is_base: z.boolean().optional(),
    base_unit_id: z.string().length(21).optional().nullable(),
    status: entityStatusSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const isBase = data.is_base ?? false
    if (isBase && data.base_unit_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'base_unit_id must be null when is_base is true',
        path: ['base_unit_id'],
      })
    }
  })

export const updateUnitBodySchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  symbol: z.string().trim().min(1).max(32).optional(),
  is_base: z.boolean().optional(),
  base_unit_id: z.string().length(21).optional().nullable(),
  status: entityStatusSchema.optional(),
})

export type CreateUnitBody = z.infer<typeof createUnitBodySchema>
export type UpdateUnitBody = z.infer<typeof updateUnitBodySchema>
