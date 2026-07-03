import { z } from 'zod'
import { entityStatusSchema } from './tags.schema.js'

export const attributeValueSchema = z
  .object({
    attribute_id: z.string().length(21),
    value_text: z.string().optional().nullable(),
    value_number: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasText = data.value_text != null && data.value_text !== ''
    const hasNumber = data.value_number != null
    if (hasText === hasNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide exactly one of value_text or value_number',
        path: ['value_text'],
      })
    }
  })

export const createCatalogBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  status: entityStatusSchema.optional(),
  tag_ids: z.array(z.string().length(21)).optional(),
  attributes: z.array(attributeValueSchema).optional(),
})

export const updateCatalogBodySchema = createCatalogBodySchema.partial()

export type CreateCatalogBody = z.infer<typeof createCatalogBodySchema>
export type UpdateCatalogBody = z.infer<typeof updateCatalogBodySchema>
