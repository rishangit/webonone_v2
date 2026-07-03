import { z } from 'zod'

const companySizeSchema = z.enum(['1-10', '11-50', '51-200', '201-500', '500+'])
const companyStatusSchema = z.enum(['pending', 'approved', 'rejected'])

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

export const updateCompanyStatusBodySchema = z.object({
  status: companyStatusSchema,
})

export type RegisterCompanyBody = z.infer<typeof registerCompanyBodySchema>
export type UpdateCompanyStatusBody = z.infer<typeof updateCompanyStatusBodySchema>

export const syncEmailRoleBodySchema = z.preprocess(
  (val) => (val === undefined || val === null ? {} : val),
  z.object({
    sessionRole: z.enum(['super_admin', 'company_admin', 'member']).optional(),
    companyId: z.string().trim().min(1).optional().nullable(),
  }),
)

export const syncDataRoleBodySchema = syncEmailRoleBodySchema

export type SyncEmailRoleBody = z.infer<typeof syncEmailRoleBodySchema>
export type SyncDataRoleBody = z.infer<typeof syncDataRoleBodySchema>
