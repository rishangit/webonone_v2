import { z } from 'zod'

const companySizeSchema = z.enum(['1-10', '11-50', '51-200', '201-500', '500+'])

export const registerCompanyBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(2000),
  companySize: companySizeSchema,
  logoUrl: z.string().url().max(2048).optional(),
  addressLine1: z.string().trim().min(1).max(255),
  addressLine2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1).max(128),
  stateRegion: z.string().trim().max(128).optional(),
  postalCode: z.string().trim().max(32).optional(),
  country: z.string().trim().min(1).max(128),
  contactEmail: z.string().trim().email().max(255),
  contactPhone: z.string().trim().min(1).max(64),
})

export const superAdminLoginBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1),
})

export type RegisterCompanyBody = z.infer<typeof registerCompanyBodySchema>
export type SuperAdminLoginBody = z.infer<typeof superAdminLoginBodySchema>
