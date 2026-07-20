import { z } from 'zod'

export const queueQuerySchema = z.object({
  status: z.enum(['pending', 'processing', 'sent', 'failed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  companyId: z.string().length(21).optional(),
})

export type QueueQuery = z.infer<typeof queueQuerySchema>
