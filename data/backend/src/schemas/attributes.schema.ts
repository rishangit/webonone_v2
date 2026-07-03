import { z } from 'zod'
import { entityStatusSchema } from './tags.schema.js'

export const createAttributeBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).optional().nullable(),
    value_type: z.enum(['number', 'text']),
    unit_id: z.string().length(21).optional().nullable(),
    status: entityStatusSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.value_type === 'number' && !data.unit_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'unit_id is required when value_type is number',
        path: ['unit_id'],
      })
    }
  })

export const updateAttributeBodySchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  value_type: z.enum(['number', 'text']).optional(),
  unit_id: z.string().length(21).optional().nullable(),
  status: entityStatusSchema.optional(),
})

export type CreateAttributeBody = z.infer<typeof createAttributeBodySchema>
export type UpdateAttributeBody = z.infer<typeof updateAttributeBodySchema>
