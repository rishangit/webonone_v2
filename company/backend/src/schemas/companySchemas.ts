import { z } from 'zod'

export const registerCompanyBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  logoUrl: z.string().url().max(2048),
})

export const superAdminLoginBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1),
})

export type RegisterCompanyBody = z.infer<typeof registerCompanyBodySchema>
export type SuperAdminLoginBody = z.infer<typeof superAdminLoginBodySchema>
