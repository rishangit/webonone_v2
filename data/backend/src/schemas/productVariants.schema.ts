import { z } from 'zod'

export const createProductVariantBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  sku: z.string().trim().min(1).max(255),
  kind: z.enum(['default', 'custom']),
  attribute_value_ids: z.array(z.string().length(21)).optional().default([]),
})

export type CreateProductVariantBody = z.infer<typeof createProductVariantBodySchema>
