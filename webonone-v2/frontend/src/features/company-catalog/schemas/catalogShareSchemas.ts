import { z } from 'zod'

export type ShareLinkValues = {
  email: string
  phone: string
}

export type ShareLinkMessages = {
  emailInvalid: string
  phoneInvalid: string
  contactRequired: string
}

export function parseShareLinkContacts(values: ShareLinkValues, messages: ShareLinkMessages) {
  return z
    .object({
      email: z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z.string().trim().email(messages.emailInvalid).max(255).optional(),
      ),
      phone: z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z
          .string()
          .trim()
          .min(5)
          .max(32)
          .regex(/^\+?[0-9\s-]{5,31}$/, messages.phoneInvalid)
          .optional(),
      ),
    })
    .refine((value) => Boolean(value.email || value.phone), {
      message: messages.contactRequired,
      path: ['email'],
    })
    .safeParse(values)
}
