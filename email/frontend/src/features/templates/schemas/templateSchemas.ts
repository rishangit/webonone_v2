import { z } from 'zod'

export const templateEditorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  htmlBody: z.string().min(1, 'HTML body is required'),
  textBody: z.string().min(1, 'Plain text body is required'),
})

export type TemplateEditorFormValues = z.infer<typeof templateEditorSchema>
