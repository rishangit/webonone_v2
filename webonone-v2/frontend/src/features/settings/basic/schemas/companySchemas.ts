import { z } from 'zod'

export const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const

export type CompanySize = (typeof COMPANY_SIZE_OPTIONS)[number]

export const registerCompanyFormSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(255),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  companySize: z.enum(COMPANY_SIZE_OPTIONS, { message: 'Company size is required' }),
  logoUrl: z.string().url('Logo is required'),
  addressLine1: z.string().trim().min(1, 'Address is required').max(255),
  addressLine2: z.string().trim().max(255),
  city: z.string().trim().min(1, 'City is required').max(128),
  stateRegion: z.string().trim().min(1, 'State or region is required').max(128),
  postalCode: z.string().trim().min(1, 'Postal code is required').max(32),
  country: z.string().trim().min(1, 'Country is required').max(128),
  contactEmail: z.string().trim().email('Enter a valid contact email').max(255),
  contactPhone: z.string().trim().min(1, 'Contact phone is required').max(64),
})

export type RegisterCompanyFormValues = z.infer<typeof registerCompanyFormSchema>

export const registerWizardStep1Schema = registerCompanyFormSchema.pick({
  name: true,
  description: true,
  companySize: true,
  logoUrl: true,
})

export const registerWizardStep2Schema = registerCompanyFormSchema.pick({
  addressLine1: true,
  addressLine2: true,
  city: true,
  stateRegion: true,
  postalCode: true,
  country: true,
  contactEmail: true,
  contactPhone: true,
})

export const superAdminLoginFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export type SuperAdminLoginFormValues = z.infer<typeof superAdminLoginFormSchema>
