import { z } from 'zod'
import { emptyWebsiteDocument, websiteDocumentSchema } from './websiteDocument.schema.js'

export const websitePageStatusSchema = z.enum(['active', 'inactive'])

export const websitePagePathSchema = z
  .string()
  .trim()
  .max(128)
  .regex(/^$|^[a-z0-9]+(?:[/-][a-z0-9]+)*$/, 'Path must be lowercase letters, numbers, slashes, and hyphens')

export const createWebsitePageSchema = z.object({
  name: z.string().trim().min(1).max(255),
  path: websitePagePathSchema.default(''),
  status: websitePageStatusSchema.optional().default('active'),
  document: websiteDocumentSchema.optional().default(emptyWebsiteDocument),
})

export const updateWebsitePageSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    path: websitePagePathSchema.optional(),
    status: websitePageStatusSchema.optional(),
    document: websiteDocumentSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type CreateWebsitePageBody = z.infer<typeof createWebsitePageSchema>
export type UpdateWebsitePageBody = z.infer<typeof updateWebsitePageSchema>
