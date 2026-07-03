import { z } from 'zod'

export const entityStatusSchema = z.enum(['verified', 'pending'])
export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be #RRGGBB')

export const createTagBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  color: hexColorSchema,
  status: entityStatusSchema.optional(),
})

export const updateTagBodySchema = createTagBodySchema.partial()

export type CreateTagBody = z.infer<typeof createTagBodySchema>
export type UpdateTagBody = z.infer<typeof updateTagBodySchema>
