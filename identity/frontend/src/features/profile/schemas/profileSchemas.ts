import { z } from 'zod'
import { normalizeLocale } from '@webonone/i18n'

const phoneNumberSchema = z
  .string()
  .max(32)
  .nullable()
  .refine((value) => !value || /^\+\d{7,15}$/.test(value), 'errors.phoneInvalid')

export const PROFILE_WIZARD_TOTAL_STEPS = 5 as const

export type ProfileWizardStep = 1 | 2 | 3 | 4 | 5

export function parseProfileWizardStep(raw: string | null | undefined): ProfileWizardStep {
  const n = Number(raw)
  if (n === 2 || n === 3 || n === 4 || n === 5) return n
  return 1
}

export const profileSchema = z.object({
  firstName: z.string().min(1, 'errors.firstNameRequired').max(100),
  lastName: z.string().min(1, 'errors.lastNameRequired').max(100),
  displayName: z.string().min(1, 'errors.displayNameRequired').max(255),
  phoneNumber: phoneNumberSchema,
  addressLine1: z.string().max(255).nullable(),
  addressLine2: z.string().max(255).nullable(),
  city: z.string().max(100).nullable(),
  stateRegion: z.string().max(100).nullable(),
  postalCode: z.string().max(20).nullable(),
  country: z
    .string()
    .refine((value) => value === '' || value.length === 2, 'errors.countryCodeInvalid'),
  locale: z.enum(['en', 'si']).nullable(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

/** Step 2 — Address (soft validation). */
export const profileWizardAddressSchema = z.object({
  addressLine1: z.string().max(255).nullable(),
  addressLine2: z.string().max(255).nullable(),
  city: z.string().max(100).nullable(),
  stateRegion: z.string().max(100).nullable(),
  postalCode: z.string().max(20).nullable(),
  country: z
    .string()
    .refine((value) => value === '' || value.length === 2, 'errors.countryCodeInvalid'),
})

/** Step 3 — Contact. */
export const profileWizardContactSchema = z.object({
  phoneNumber: phoneNumberSchema,
  locale: z.enum(['en', 'si']).nullable(),
})

/** Step 4 — Name (required). */
export const profileWizardNameSchema = z.object({
  firstName: z.string().min(1, 'errors.firstNameRequired').max(100),
  lastName: z.string().min(1, 'errors.lastNameRequired').max(100),
  displayName: z.string().min(1, 'errors.displayNameRequired').max(255),
})

export function userToProfileFormValues(user: {
  firstName: string
  lastName: string
  displayName: string
  phoneNumber: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  country: string | null
  locale: string | null
}): ProfileFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    phoneNumber: user.phoneNumber,
    addressLine1: user.addressLine1,
    addressLine2: user.addressLine2,
    city: user.city,
    stateRegion: user.stateRegion,
    postalCode: user.postalCode,
    country: user.country ?? '',
    locale: user.locale ? normalizeLocale(user.locale) : null,
  }
}

export function profileFormToUpdateInput(values: ProfileFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    displayName: values.displayName,
    phoneNumber: values.phoneNumber || null,
    addressLine1: values.addressLine1 || null,
    addressLine2: values.addressLine2 || null,
    city: values.city || null,
    stateRegion: values.stateRegion || null,
    postalCode: values.postalCode || null,
    country: values.country ? values.country.toUpperCase() : null,
    locale: values.locale ? normalizeLocale(values.locale) : null,
  }
}
