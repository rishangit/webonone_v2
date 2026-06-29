import { z } from 'zod'

export const testEmailSchema = z.object({
  templateSlug: z.string().min(1, 'Template is required'),
  toEmail: z.string().min(1, 'Recipient email is required').email('Enter a valid email'),
})

export type TestEmailFormValues = z.infer<typeof testEmailSchema>
