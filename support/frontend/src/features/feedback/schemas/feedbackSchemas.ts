import { z } from 'zod'

export const feedbackTypeSchema = z.enum(['bug', 'feature'])
export const feedbackStatusSchema = z.enum(['todo', 'in_progress', 'completed'])

export const createFeedbackFormSchema = z.object({
  type: feedbackTypeSchema,
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().min(1, 'Description is required').max(10000, 'Description is too long'),
})

export type FeedbackType = z.infer<typeof feedbackTypeSchema>
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>
export type CreateFeedbackFormValues = z.infer<typeof createFeedbackFormSchema>
