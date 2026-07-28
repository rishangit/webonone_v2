import { z } from 'zod'
import { entityStatusSchema } from './tags.schema.js'

export const createAttributeBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  value_type: z.enum(['number', 'text']),
  /** Optional — attributes may have no unit of measure. */
  unit_id: z.string().length(21).optional().nullable(),
  status: entityStatusSchema.optional(),
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
