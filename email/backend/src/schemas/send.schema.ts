import { z } from 'zod'

export const sendEmailBodySchema = z.object({
  templateSlug: z.string().min(1).max(64),
  toEmail: z.string().email(),
  payload: z.record(z.string()),
  companyId: z.string().length(21).optional(),
})

export type SendEmailBody = z.infer<typeof sendEmailBodySchema>

export const sendTestEmailBodySchema = z.object({
  templateSlug: z.string().min(1).max(64),
  toEmail: z.string().email(),
  payload: z.record(z.string()).optional().default({}),
  companyId: z.string().length(21).optional(),
})

export type SendTestEmailBody = z.infer<typeof sendTestEmailBodySchema>
