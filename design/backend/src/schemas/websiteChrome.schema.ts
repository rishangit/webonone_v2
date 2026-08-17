import { z } from 'zod'
import { emptyWebsiteDocument, websiteDocumentSchema } from './websiteDocument.schema.js'

export const createWebsiteChromeSchema = z.object({
  name: z.string().trim().min(1).max(255),
  isDefault: z.boolean().optional().default(false),
  document: websiteDocumentSchema.optional().default(emptyWebsiteDocument),
})

export const updateWebsiteChromeSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    isDefault: z.boolean().optional(),
    document: websiteDocumentSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type CreateWebsiteChromeBody = z.infer<typeof createWebsiteChromeSchema>
export type UpdateWebsiteChromeBody = z.infer<typeof updateWebsiteChromeSchema>
