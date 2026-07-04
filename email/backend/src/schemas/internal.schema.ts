import { z } from 'zod'

export const internalSendBodySchema = z.object({
  templateSlug: z.string().min(1).max(64),
  toEmail: z.string().email(),
  payload: z.record(z.string()),
  companyId: z.string().length(21).optional(),
  requestedByService: z.enum(['identity', 'webonone']),
})

export type InternalSendBody = z.infer<typeof internalSendBodySchema>
