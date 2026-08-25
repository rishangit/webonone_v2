import { z } from 'zod'

const e164Phone = z
  .string()
  .trim()
  .regex(/^\+\d{7,15}$/, 'errors.phoneInvalid')

export const createCompanyUserSchema = z
  .object({
    firstName: z.string().trim().min(1, 'errors.firstNameRequired').max(100),
    lastName: z.string().trim().min(1, 'errors.lastNameRequired').max(100),
    email: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().trim().email('errors.emailInvalid').max(255).optional(),
    ),
    phoneNumber: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      e164Phone.optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.emailOrPhoneRequired',
        path: ['email'],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'errors.emailOrPhoneRequired',
        path: ['phoneNumber'],
      })
    }
  })

export type CreateCompanyUserPayload = z.infer<typeof createCompanyUserSchema>
