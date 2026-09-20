import { z } from 'zod'

const e164Phone = z
  .string()
  .trim()
  .regex(/^\+\d{7,15}$/, 'Enter a valid phone number with country code')

export const createCompanyUserSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    email: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().trim().email('Enter a valid email').max(255).optional(),
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
        message: 'Enter an email or phone number',
        path: ['email'],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter an email or phone number',
        path: ['phoneNumber'],
      })
    }
  })

export type CreateCompanyUserPayload = z.infer<typeof createCompanyUserSchema>

export function mapZodIssuesToFieldErrors(
  issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }>,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.')
    if (key && !result[key]) {
      result[key] = issue.message
    }
  }
  return result
}
