import { z } from 'zod'

const phoneNumber = z
  .string()
  .min(5)
  .max(32)
  .regex(/^\+?[0-9\s-]{5,31}$/, 'Invalid phone number')

export const sendSmsBodySchema = z
  .object({
    toNumber: phoneNumber,
    body: z.string().min(1).max(1600).optional(),
    templateSlug: z.string().min(1).max(64).optional(),
    payload: z.record(z.string()).optional().default({}),
    companyId: z.string().length(21).optional(),
  })
  .refine((data) => Boolean(data.body) || Boolean(data.templateSlug), {
    message: 'Provide either body or templateSlug',
    path: ['body'],
  })

export type SendSmsBody = z.infer<typeof sendSmsBodySchema>

export const sendTestSmsBodySchema = z.object({
  toNumber: phoneNumber,
  body: z.string().min(1).max(1600).optional(),
  templateSlug: z.string().min(1).max(64).optional(),
  payload: z.record(z.string()).optional().default({}),
  companyId: z.string().length(21).optional(),
})

export type SendTestSmsBody = z.infer<typeof sendTestSmsBodySchema>

export const otpSendBodySchema = z.object({
  toNumber: phoneNumber,
  purpose: z.string().min(1).max(64).default('verification'),
  companyId: z.string().length(21).optional(),
})

export type OtpSendBody = z.infer<typeof otpSendBodySchema>

export const otpVerifyBodySchema = z.object({
  toNumber: phoneNumber,
  purpose: z.string().min(1).max(64).default('verification'),
  code: z.string().min(4).max(10),
  companyId: z.string().length(21).optional(),
})

export type OtpVerifyBody = z.infer<typeof otpVerifyBodySchema>
