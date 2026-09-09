import { z } from 'zod'
import { emptyWebsiteDocument, websiteDocumentSchema } from './websiteDocument.schema.js'

export const websitePageStatusSchema = z.enum(['active', 'inactive'])

export const websitePagePathSchema = z
  .string()
  .trim()
  .max(128)
  .regex(/^$|^[a-z0-9]+(?:[/-][a-z0-9]+)*$/, 'Path must be lowercase letters, numbers, slashes, and hyphens')

const optionalLayoutIdSchema = z
  .union([z.string().trim().length(21), z.literal(''), z.null()])
  .transform((value) => (value ? value : null))
  .optional()

export const createWebsitePageSchema = z.object({
  name: z.string().trim().min(1).max(255),
  path: websitePagePathSchema.default(''),
  status: websitePageStatusSchema.optional().default('active'),
  layoutId: optionalLayoutIdSchema,
  document: websiteDocumentSchema.optional().default(emptyWebsiteDocument),
})

export const updateWebsitePageSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    path: websitePagePathSchema.optional(),
    status: websitePageStatusSchema.optional(),
    layoutId: optionalLayoutIdSchema,
    sortOrder: z.number().int().min(0).max(10000).optional(),
    document: websiteDocumentSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type CreateWebsitePageBody = z.infer<typeof createWebsitePageSchema>
export type UpdateWebsitePageBody = z.infer<typeof updateWebsitePageSchema>
