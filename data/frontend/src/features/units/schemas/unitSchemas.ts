import { z } from 'zod'

export const unitFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000).optional(),
  symbol: z.string().trim().min(1, 'Symbol is required').max(32),
  isBase: z.boolean(),
  baseUnitId: z.string().optional(),
  status: z.enum(['verified', 'pending']),
})

export type UnitFormValues = z.infer<typeof unitFormSchema>
