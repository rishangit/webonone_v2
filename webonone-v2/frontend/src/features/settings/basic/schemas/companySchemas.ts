import { z } from 'zod'

export const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const

export type CompanySize = (typeof COMPANY_SIZE_OPTIONS)[number]

/** Slim register: name required; other fields optional (completed on profile). */
export const registerCompanyFormSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(255),
  description: z.string().trim().max(2000),
  companySize: z.union([z.enum(COMPANY_SIZE_OPTIONS), z.literal('')]),
  addressLine1: z.string().trim().max(255),
  addressLine2: z.string().trim().max(255),
  city: z.string().trim().max(128),
  stateRegion: z.string().trim().max(128),
  postalCode: z.string().trim().max(32),
  countryIso2: z.string().trim().max(2),
  contactEmail: z.union([
    z.literal(''),
    z.string().trim().email('Enter a valid contact email').max(255),
  ]),
  contactPhone: z.string().trim().max(64),
})

export type RegisterCompanyFormValues = z.infer<typeof registerCompanyFormSchema>

export const registerWizardStep1Schema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(255),
  description: z.string().trim().max(2000),
  companySize: z.union([z.enum(COMPANY_SIZE_OPTIONS), z.literal('')]),
})

export const companyProfileCardSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(255),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  companySize: z.enum(COMPANY_SIZE_OPTIONS, { message: 'Company size is required' }),
})

export type CompanyProfileCardValues = z.infer<typeof companyProfileCardSchema>

export const companyContactCardSchema = z.object({
  contactEmail: z.string().trim().email('Enter a valid contact email').max(255),
  contactPhone: z.string().trim().min(1, 'Contact phone is required').max(64),
})

export type CompanyContactCardValues = z.infer<typeof companyContactCardSchema>

export const companyLocationCardSchema = z.object({
  addressLine1: z.string().trim().min(1, 'Address is required').max(255),
  addressLine2: z.string().trim().max(255),
  city: z.string().trim().min(1, 'City is required').max(128),
  stateRegion: z.string().trim().max(128),
  postalCode: z.string().trim().max(32),
  country: z.string().trim().min(1, 'Country is required').max(128),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  mapPlaceId: z.string().trim().max(255).nullable(),
  mapFormattedAddress: z.string().trim().max(512).nullable(),
})

export type CompanyLocationCardValues = z.infer<typeof companyLocationCardSchema>
