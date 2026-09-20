import { z } from 'zod'
import type { IdentityProfile } from '@/features/auth/authApi'

const phoneNumberSchema = z
  .string()
  .max(32)
  .nullable()
  .refine((value) => !value || /^\+\d{7,15}$/.test(value), 'Enter a valid phone number in E.164 format (e.g. +94771234567)')

export const PROFILE_WIZARD_TOTAL_STEPS = 5 as const

export type ProfileWizardStep = 1 | 2 | 3 | 4 | 5

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  displayName: z.string().min(1, 'Display name is required').max(255),
  phoneNumber: phoneNumberSchema,
  addressLine1: z.string().max(255).nullable(),
  addressLine2: z.string().max(255).nullable(),
  city: z.string().max(100).nullable(),
  stateRegion: z.string().max(100).nullable(),
  postalCode: z.string().max(20).nullable(),
  country: z
    .string()
    .refine((value) => value === '' || value.length === 2, 'Country must be a 2-letter code'),
  locale: z.enum(['en', 'si']).nullable(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

export const profileWizardAddressSchema = z.object({
  addressLine1: z.string().max(255).nullable(),
  addressLine2: z.string().max(255).nullable(),
  city: z.string().max(100).nullable(),
  stateRegion: z.string().max(100).nullable(),
  postalCode: z.string().max(20).nullable(),
  country: z
    .string()
    .refine((value) => value === '' || value.length === 2, 'Country must be a 2-letter code'),
})

export const profileWizardContactSchema = z.object({
  phoneNumber: phoneNumberSchema,
  locale: z.enum(['en', 'si']).nullable(),
})

export const profileWizardNameSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  displayName: z.string().min(1, 'Display name is required').max(255),
})

function normalizeLocale(locale: string): 'en' | 'si' {
  return locale === 'si' ? 'si' : 'en'
}

export function userToProfileFormValues(user: IdentityProfile): ProfileFormValues {
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

export function mapZodIssuesToFieldErrors<T extends string>(
  issues: { path: (string | number)[]; message: string }[],
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in errors)) {
      errors[key as T] = issue.message
    }
  }
  return errors
}
