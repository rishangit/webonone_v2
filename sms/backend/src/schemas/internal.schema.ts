import { z } from 'zod'

const phoneNumber = z
  .string()
  .min(5)
  .max(32)
  .regex(/^\+?[0-9\s-]{5,31}$/, 'Invalid phone number')

export const internalSendBodySchema = z
  .object({
    toNumber: phoneNumber,
    body: z.string().min(1).max(1600).optional(),
    templateSlug: z.string().min(1).max(64).optional(),
    payload: z.record(z.string()).optional().default({}),
    companyId: z.string().length(21).optional(),
    requestedByService: z.enum(['identity', 'webonone']),
  })
  .refine((data) => Boolean(data.body) || Boolean(data.templateSlug), {
    message: 'Provide either body or templateSlug',
    path: ['body'],
  })

export type InternalSendBody = z.infer<typeof internalSendBodySchema>

export const internalOtpSendBodySchema = z.object({
  toNumber: phoneNumber,
  purpose: z.string().min(1).max(64),
  companyId: z.string().length(21).optional(),
  requestedByService: z.enum(['identity', 'webonone']),
})

export type InternalOtpSendBody = z.infer<typeof internalOtpSendBodySchema>

export const internalOtpVerifyBodySchema = z.object({
  toNumber: phoneNumber,
  purpose: z.string().min(1).max(64),
  code: z.string().min(4).max(10),
  companyId: z.string().length(21).optional(),
})

export type InternalOtpVerifyBody = z.infer<typeof internalOtpVerifyBodySchema>
