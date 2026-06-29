import { z } from 'zod'

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['sent', 'failed']).optional(),
  templateSlug: z.string().max(64).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  companyId: z.string().length(21).optional(),
})

export type HistoryQuery = z.infer<typeof historyQuerySchema>
