import { z } from 'zod'

export const createTemplateBodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, 'Slug must be lowercase letters, numbers, or underscores'),
  name: z.string().min(1).max(255),
  body: z.string().min(1).max(1600),
  requiredKeys: z.array(z.string().max(64)).optional().default([]),
  isActive: z.boolean().optional().default(true),
})

export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>

export const updateTemplateBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(1600).optional(),
  requiredKeys: z.array(z.string().max(64)).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>

export const previewTemplateBodySchema = z.object({
  payload: z.record(z.string()).optional().default({}),
})

export type PreviewTemplateBody = z.infer<typeof previewTemplateBodySchema>

export const restoreTemplateBodySchema = z.object({
  versionId: z.string().length(21),
})

export type RestoreTemplateBody = z.infer<typeof restoreTemplateBodySchema>
