import { z } from 'zod'

const optionalChromeIdSchema = z
  .union([z.string().trim().length(21), z.literal(''), z.null()])
  .transform((value) => (value ? value : null))
  .optional()

export const createWebsiteLayoutSchema = z.object({
  name: z.string().trim().min(1).max(255),
  headerId: optionalChromeIdSchema,
  footerId: optionalChromeIdSchema,
  themeId: optionalChromeIdSchema,
  isDefault: z.boolean().optional().default(false),
  pageIds: z.array(z.string().trim().min(1).max(21)).max(200).optional(),
})

export const updateWebsiteLayoutSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    headerId: optionalChromeIdSchema,
    footerId: optionalChromeIdSchema,
    themeId: optionalChromeIdSchema,
    isDefault: z.boolean().optional(),
    pageIds: z.array(z.string().trim().min(1).max(21)).max(200).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type CreateWebsiteLayoutBody = z.infer<typeof createWebsiteLayoutSchema>
export type UpdateWebsiteLayoutBody = z.infer<typeof updateWebsiteLayoutSchema>
