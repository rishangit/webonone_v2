import { z } from 'zod'

const phoneNumber = z
  .string()
  .min(1, 'Recipient number is required')
  .regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number')

export const sendTemplateSchema = z.object({
  mode: z.literal('template'),
  templateSlug: z.string().min(1, 'Template is required'),
  toNumber: phoneNumber,
  payload: z.record(z.string()),
})

export const sendFreeformSchema = z.object({
  mode: z.literal('freeform'),
  toNumber: phoneNumber,
  body: z.string().min(1, 'Message body is required').max(1600, 'Message is too long'),
})

export const sendSmsSchema = z.discriminatedUnion('mode', [sendTemplateSchema, sendFreeformSchema])

export type SendSmsFormValues = z.infer<typeof sendSmsSchema>
