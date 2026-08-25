import { z } from 'zod'
import type { UserProfile } from '@/features/auth/types/auth.types'
import type { CompanyTag } from '../services/companyApi'

export const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const

export type CompanySize = (typeof COMPANY_SIZE_OPTIONS)[number]

export const COMPANY_WIZARD_TOTAL_STEPS = 6 as const

export type CompanyWizardStep = 1 | 2 | 3 | 4 | 5 | 6

export function parseCompanyWizardStep(raw: string | null | undefined): CompanyWizardStep {
  const n = Number(raw)
  if (n === 2 || n === 3 || n === 4 || n === 5 || n === 6) return n
  return 1
}

export type CompanyWizardContactPerson = {
  id: string
  displayName: string
  email: string | null
  avatarUrl?: string | null
}

/** UI form state for the create/edit company wizard. */
export type CompanyWizardFormValues = {
  name: string
  description: string
  companySize: CompanySize | ''
  contactPerson: CompanyWizardContactPerson | null
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
  contactPerson: null,
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

const companyWizardContactPersonSchema = z.object({
  id: z.string().trim().min(1, 'Contact person is required'),
  displayName: z.string().trim().min(1),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable().optional(),
})

export function contactPersonFromAuthUser(user: UserProfile | null): CompanyWizardContactPerson | null {
  if (!user) return null
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
  }
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
  contactPersonUserId: z.string().trim().min(1, 'Contact person is required'),
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

/** Create step 2 — contact person required; email format only when present. */
export const companyWizardCreateStep2Schema = z.object({
  contactPerson: companyWizardContactPersonSchema,
  contactEmail: z.union([
    z.literal(''),
    z.string().trim().email('Enter a valid contact email').max(255),
  ]),
  contactPhone: z.string().trim().max(64),
})

/** Create step 3 — postal / street address; all optional. */
export const companyWizardCreateStep3Schema = z.object({
  addressLine1: z.string().trim().max(255),
  addressLine2: z.string().trim().max(255),
  city: z.string().trim().max(128),
  stateRegion: z.string().trim().max(128),
  postalCode: z.string().trim().max(32),
  country: z.string().trim().max(128),
})

/** Create step 4 — map pin; all optional. */
export const companyWizardCreateStep4Schema = z.object({
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
  contactPerson: companyWizardContactPersonSchema,
  contactEmail: z.string().trim().email('Enter a valid contact email').max(255),
  contactPhone: z.string().trim().min(1, 'Contact phone is required').max(64),
})

export type CompanyContactCardValues = z.infer<typeof companyContactCardSchema>

export const companyAddressCardSchema = z.object({
  addressLine1: z.string().trim().min(1, 'Address is required').max(255),
  addressLine2: z.string().trim().max(255),
  city: z.string().trim().min(1, 'City is required').max(128),
  stateRegion: z.string().trim().max(128),
  postalCode: z.string().trim().max(32),
  country: z.string().trim().min(1, 'Country is required').max(128),
})

export type CompanyAddressCardValues = z.infer<typeof companyAddressCardSchema>

export const companyLocationCardSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  mapPlaceId: z.string().trim().max(255).nullable(),
  mapFormattedAddress: z.string().trim().max(512).nullable(),
})

export type CompanyLocationCardValues = z.infer<typeof companyLocationCardSchema>

/** @deprecated Use companyWizardCreateStep1Schema */
export const registerWizardStep1Schema = companyWizardCreateStep1Schema
