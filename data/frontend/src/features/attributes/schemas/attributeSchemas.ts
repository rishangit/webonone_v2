import { z } from 'zod'

export const attributeFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000).optional(),
  valueType: z.enum(['number', 'text']),
  /** Optional — attributes may have no unit of measure. */
  unitId: z.string().optional(),
  status: z.enum(['verified', 'pending']),
})

export type AttributeFormValues = z.infer<typeof attributeFormSchema>
