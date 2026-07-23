import { z } from 'zod'

const companySizeSchema = z.enum(['1-10', '11-50', '51-200', '201-500', '500+'])
const companyStatusSchema = z.enum(['pending', 'approved', 'rejected'])

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v))

/** Slim register: only name required; contact/location completed on profile. */
export const registerCompanyBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: optionalTrimmed(2000),
  companySize: companySizeSchema.optional(),
  logoUrl: z.string().url().max(2048).optional(),
  addressLine1: optionalTrimmed(255),
  addressLine2: optionalTrimmed(255),
  city: optionalTrimmed(128),
  stateRegion: optionalTrimmed(128),
  postalCode: optionalTrimmed(32),
  country: optionalTrimmed(128),
  contactEmail: z
    .union([
      z.string().trim().email().max(255),
      z.literal('').transform(() => undefined),
    ])
    .optional(),
  contactPhone: optionalTrimmed(64),
})

export const updateCompanyStatusBodySchema = z.object({
  status: companyStatusSchema,
})

const nullableString = (max: number) =>
  z.union([z.string().trim().max(max), z.null()]).optional()

const nullableEmail = z
  .union([z.string().trim().email().max(255), z.literal('').transform(() => null), z.null()])
  .optional()

const galleryImageSchema = z.object({
  mediaId: z.string().trim().min(1).max(64),
  url: z.string().url().max(2048),
})

export const updateCompanyBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: nullableString(2000),
    companySize: z.union([companySizeSchema, z.null()]).optional(),
    logoUrl: z.union([z.string().url().max(2048), z.null()]).optional(),
    galleryImages: z.union([z.array(galleryImageSchema).max(24), z.null()]).optional(),
    contactEmail: nullableEmail,
    contactPhone: nullableString(64),
    addressLine1: nullableString(255),
    addressLine2: nullableString(255),
    city: nullableString(128),
    stateRegion: nullableString(128),
    postalCode: nullableString(32),
    country: nullableString(128),
    latitude: z.union([z.number().min(-90).max(90), z.null()]).optional(),
    longitude: z.union([z.number().min(-180).max(180), z.null()]).optional(),
    mapPlaceId: nullableString(255),
    mapFormattedAddress: nullableString(512),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type RegisterCompanyBody = z.infer<typeof registerCompanyBodySchema>
export type UpdateCompanyStatusBody = z.infer<typeof updateCompanyStatusBodySchema>
export type UpdateCompanyBody = z.infer<typeof updateCompanyBodySchema>
