import { z } from 'zod'

const slug = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, or underscores')

export const templateEditorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  htmlBody: z.string().min(1, 'HTML body is required'),
  textBody: z.string().min(1, 'Plain text body is required'),
})

export type TemplateEditorFormValues = z.infer<typeof templateEditorSchema>

export const templateCreateSchema = templateEditorSchema.extend({
  slug,
})

export type TemplateCreateFormValues = z.infer<typeof templateCreateSchema>
