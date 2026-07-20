import { z } from 'zod'

const slug = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9_-]+$/, 'Use lowercase letters, numbers, hyphens or underscores')

export const templateEditorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  body: z.string().min(1, 'Message body is required').max(1600, 'Message is too long'),
})

export type TemplateEditorFormValues = z.infer<typeof templateEditorSchema>

export const templateCreateSchema = z.object({
  slug,
  name: z.string().min(1, 'Name is required'),
  body: z.string().min(1, 'Message body is required').max(1600, 'Message is too long'),
})

export type TemplateCreateFormValues = z.infer<typeof templateCreateSchema>
