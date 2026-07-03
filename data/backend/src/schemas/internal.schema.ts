import { z } from 'zod'

export const syncUserRoleBodySchema = z.object({
  userId: z.string().length(21),
  role: z.enum(['super_admin', 'company_admin', 'member']),
  companyId: z.string().length(21).nullable().optional(),
})

export type SyncUserRoleBody = z.infer<typeof syncUserRoleBodySchema>
