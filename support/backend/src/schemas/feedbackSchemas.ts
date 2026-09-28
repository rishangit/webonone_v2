import { z } from 'zod'

export const feedbackTypeSchema = z.enum(['bug', 'feature'])
export const feedbackStatusSchema = z.enum(['todo', 'in_progress', 'completed'])

const uploadSessionIdSchema = z.string().min(1).max(21).regex(/^[A-Za-z0-9_-]+$/, 'Invalid upload session')

export const feedbackAttachmentSchema = z.object({
  mediaId: z.string().min(1).max(21),
  url: z.string().url().max(2048),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127).refine((v) => v.startsWith('image/'), 'Attachment must be an image'),
})

export const createFeedbackBodySchema = z
  .object({
    type: feedbackTypeSchema,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(10000),
    uploadSessionId: uploadSessionIdSchema.optional(),
    attachment: feedbackAttachmentSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attachment && !data.uploadSessionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'uploadSessionId is required when attachment is provided',
        path: ['uploadSessionId'],
      })
    }
    if (!data.attachment && data.uploadSessionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'uploadSessionId must not be sent without an attachment',
        path: ['uploadSessionId'],
      })
    }
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

export function buildSupportFeedbackMediaScope(uploadSessionId: string): string {
  return `support:feedback:${uploadSessionId}`
}
