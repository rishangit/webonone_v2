import { z } from 'zod'

export const feedbackTypeSchema = z.enum(['bug', 'feature'])
export const feedbackStatusSchema = z.enum(['todo', 'in_progress', 'completed'])

export const createFeedbackBodySchema = z.object({
  type: feedbackTypeSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
})

export const updateFeedbackStatusBodySchema = z.object({
  status: feedbackStatusSchema,
})

export const listFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  type: feedbackTypeSchema.optional(),
  status: feedbackStatusSchema.optional(),
  q: z.string().trim().optional(),
})

export type FeedbackType = z.infer<typeof feedbackTypeSchema>
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>
export type CreateFeedbackBody = z.infer<typeof createFeedbackBodySchema>
export type UpdateFeedbackStatusBody = z.infer<typeof updateFeedbackStatusBodySchema>
export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>
