import { z } from 'zod'

export const attributeFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255),
    description: z.string().trim().max(5000).optional(),
    valueType: z.enum(['number', 'text']),
    unitId: z.string().optional(),
    status: z.enum(['verified', 'pending']),
  })
  .superRefine((data, ctx) => {
    if (data.valueType === 'number' && !data.unitId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Unit is required for number attributes', path: ['unitId'] })
    }
  })

export type AttributeFormValues = z.infer<typeof attributeFormSchema>
