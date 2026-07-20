import { z } from 'zod'

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  status: z.enum(['sent', 'failed']).optional(),
  search: z.string().max(128).optional(),
  companyId: z.string().length(21).optional(),
})

export type HistoryQuery = z.infer<typeof historyQuerySchema>
