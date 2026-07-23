import { z } from 'zod'

const e164Phone = z
  .string()
  .trim()
  .regex(/^\+\d{7,15}$/, 'Enter a valid phone number with country code')

export const createCompanyUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email('Enter a valid email').max(255).optional(),
  ),
  phoneNumber: e164Phone,
})

export type CreateCompanyUserPayload = z.infer<typeof createCompanyUserSchema>
