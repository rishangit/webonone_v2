import { z } from 'zod'
import { entityStatusSchema } from './tags.schema.js'

/** Link attribute definitions to a catalog entity (values managed separately). */
export const attributeLinkSchema = z.object({
  attribute_id: z.string().length(21),
})

export const createCatalogBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  status: entityStatusSchema.optional(),
  tag_ids: z.array(z.string().length(21)).optional(),
  attributes: z.array(attributeLinkSchema).optional(),
})

export const updateCatalogBodySchema = createCatalogBodySchema.partial()

export type CreateCatalogBody = z.infer<typeof createCatalogBodySchema>
export type UpdateCatalogBody = z.infer<typeof updateCatalogBodySchema>

const galleryImageSchema = z.object({
  mediaId: z.string().min(1).max(64),
  url: z.string().url().max(2048),
})

export const updateCatalogGalleryBodySchema = z.object({
  galleryImages: z.array(galleryImageSchema).max(24),
})

export type CatalogGalleryImage = z.infer<typeof galleryImageSchema>
export type UpdateCatalogGalleryBody = z.infer<typeof updateCatalogGalleryBodySchema>

export const replaceCatalogAttributesBodySchema = z.object({
  attribute_ids: z.array(z.string().length(21)),
})

export type ReplaceCatalogAttributesBody = z.infer<typeof replaceCatalogAttributesBodySchema>

export const replaceServiceSpacesBodySchema = z.object({
  space_ids: z.array(z.string().length(21)),
})

export type ReplaceServiceSpacesBody = z.infer<typeof replaceServiceSpacesBodySchema>

export const catalogAttributeValueBodySchema = z
  .object({
    value_text: z.string().optional().nullable(),
    value_number: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasText = data.value_text != null && data.value_text !== ''
    const hasNumber = data.value_number != null
    if (hasText === hasNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide exactly one of value_text or value_number',
        path: ['value_text'],
      })
    }
  })

export type CatalogAttributeValueBody = z.infer<typeof catalogAttributeValueBodySchema>
