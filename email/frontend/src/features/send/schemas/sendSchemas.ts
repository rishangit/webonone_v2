import { z } from 'zod'

export const sendEmailSchema = z.object({
  templateSlug: z.string().min(1, 'Template is required'),
  toEmail: z.string().min(1, 'Recipient email is required').email('Enter a valid email'),
  payload: z.record(z.string()),
})

export type SendEmailFormValues = z.infer<typeof sendEmailSchema>
