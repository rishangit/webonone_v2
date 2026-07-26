import { z } from 'zod'
import type { CompanyTag } from '../services/companyApi'

export const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const

export type CompanySize = (typeof COMPANY_SIZE_OPTIONS)[number]

export const COMPANY_WIZARD_TOTAL_STEPS = 5 as const

export type CompanyWizardStep = 1 | 2 | 3 | 4 | 5

export function parseCompanyWizardStep(raw: string | null | undefined): CompanyWizardStep {
  const n = Number(raw)
  if (n === 2 || n === 3 || n === 4 || n === 5) return n
  return 1
}

/** UI form state for the create/edit company wizard. */
export type CompanyWizardFormValues = {
  name: string
  description: string
  companySize: CompanySize | ''
  contactEmail: string
  phoneCountry: string
  phoneNational: string
  addressLine1: string
  addressLine2: string
  city: string
  stateRegion: string
  postalCode: string
  country: string
  latitude: number | null
  longitude: number | null
  mapPlaceId: string | null
  mapFormattedAddress: string | null
  tags: CompanyTag[]
}

export const EMPTY_COMPANY_WIZARD_VALUES: CompanyWizardFormValues = {
  name: '',
  description: '',
  companySize: '',
  contactEmail: '',
  phoneCountry: '',
  phoneNational: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  country: '',
  latitude: null,
  longitude: null,
  mapPlaceId: null,
  mapFormattedAddress: null,
  tags: [],
}

/** Slim register payload (API). Name required; other fields optional. */
export const registerCompanyFormSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(255),
  description: z.string().trim().max(2000),
  companySize: z.union([z.enum(COMPANY_SIZE_OPTIONS), z.literal('')]),
  addressLine1: z.string().trim().max(255),
  addressLine2: z.string().trim().max(255),
  city: z.string().trim().max(128),
  stateRegion: z.string().trim().max(128),
  postalCode: z.string().trim().max(32),
  country: z.string().trim().max(128),
  contactEmail: z.union([
    z.literal(''),
    z.string().trim().email('Enter a valid contact email').max(255),
  ]),
  contactPhone: z.string().trim().max(64),
})

export type RegisterCompanyFormValues = z.infer<typeof registerCompanyFormSchema>

/** Create step 1 — name required; description/size optional. */
export const companyWizardCreateStep1Schema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(255),
  description: z.string().trim().max(2000),
  companySize: z.union([z.enum(COMPANY_SIZE_OPTIONS), z.literal('')]),
})

/** Create step 2 — email format only when present. */
export const companyWizardCreateStep2Schema = z.object({
  contactEmail: z.union([
    z.literal(''),
    z.string().trim().email('Enter a valid contact email').max(255),
  ]),
  contactPhone: z.string().trim().max(64),
})

/** Create step 3 — all optional; soft max lengths. */
export const companyWizardCreateStep3Schema = z.object({
  addressLine1: z.string().trim().max(255),
  addressLine2: z.string().trim().max(255),
  city: z.string().trim().max(128),
  stateRegion: z.string().trim().max(128),
  postalCode: z.string().trim().max(32),
  country: z.string().trim().max(128),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  mapPlaceId: z.string().trim().max(255).nullable(),
  mapFormattedAddress: z.string().trim().max(512).nullable(),
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

/** @deprecated Use companyWizardCreateStep1Schema */
export const registerWizardStep1Schema = companyWizardCreateStep1Schema
