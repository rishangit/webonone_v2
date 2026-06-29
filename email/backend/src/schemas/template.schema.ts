import { z } from 'zod'

export const updateTemplateBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(512).optional(),
  htmlBody: z.string().min(1).optional(),
  textBody: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>

export const previewTemplateBodySchema = z.object({
  payload: z.record(z.string()).optional().default({}),
  companyId: z.string().length(21).optional(),
})

export type PreviewTemplateBody = z.infer<typeof previewTemplateBodySchema>

export const restoreTemplateBodySchema = z.object({
  versionId: z.string().length(21),
})

export type RestoreTemplateBody = z.infer<typeof restoreTemplateBodySchema>
