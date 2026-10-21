import { z } from 'zod'
import { emptyWebsiteDocument, websiteDocumentSchema } from './websiteDocument.schema.js'

export const createWebsitePresetSchema = z.object({
  name: z.string().trim().min(1).max(255),
  colorPaletteId: z.string().trim().max(64).nullable().optional(),
  document: websiteDocumentSchema.optional().default(emptyWebsiteDocument),
})

export const updateWebsitePresetSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    colorPaletteId: z.string().trim().max(64).nullable().optional(),
    document: websiteDocumentSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type CreateWebsitePresetBody = z.infer<typeof createWebsitePresetSchema>
export type UpdateWebsitePresetBody = z.infer<typeof updateWebsitePresetSchema>
