import { z } from 'zod'

export const internalSendBodySchema = z.object({
  templateSlug: z.string().min(1).max(64),
  toEmail: z.string().email(),
  payload: z.record(z.string()),
  companyId: z.string().length(21).optional(),
  requestedByService: z.enum(['identity', 'webonone']),
})

export type InternalSendBody = z.infer<typeof internalSendBodySchema>

export const syncUserRoleBodySchema = z.object({
  userId: z.string().length(21),
  email: z.string().email().optional(),
  displayName: z.string().max(255).optional(),
  role: z.enum(['super_admin', 'company_admin', 'member']),
  companyId: z.string().length(21).nullable().optional(),
})

export type SyncUserRoleBody = z.infer<typeof syncUserRoleBodySchema>
