import { z } from 'zod'

export const reviewEntityKindSchema = z.enum(['product', 'service', 'space'])

export const createReviewBodySchema = z.object({
  companyId: z.string().length(21),
  entityKind: reviewEntityKindSchema,
  entityId: z.string().length(21),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(5000).nullable().optional(),
  sourceEventId: z.string().length(21).nullable().optional(),
  sourceOccurrenceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
})

export const updateReviewBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(5000).nullable().optional(),
})

export const reviewMeQuerySchema = z.object({
  companyId: z.string().length(21),
  entityKind: reviewEntityKindSchema,
  entityId: z.string().length(21),
})

export const reviewPublicListQuerySchema = reviewMeQuerySchema.extend({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(12),
})

export type CreateReviewBody = z.infer<typeof createReviewBodySchema>
export type UpdateReviewBody = z.infer<typeof updateReviewBodySchema>
