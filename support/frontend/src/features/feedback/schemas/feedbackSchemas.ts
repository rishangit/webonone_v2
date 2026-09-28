import { z } from 'zod'

export const feedbackTypeSchema = z.enum(['bug', 'feature'])
export const feedbackStatusSchema = z.enum(['todo', 'in_progress', 'completed'])

const uploadSessionIdSchema = z
  .string()
  .min(1)
  .max(21)
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid upload session')

export const feedbackAttachmentSchema = z.object({
  mediaId: z.string().min(1).max(21),
  url: z.string().url().max(2048),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127).refine((v) => v.startsWith('image/'), 'Attachment must be an image'),
})

export const createFeedbackFormSchema = z
  .object({
    type: feedbackTypeSchema,
    title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(10000, 'Description is too long'),
    uploadSessionId: uploadSessionIdSchema.optional(),
    attachment: feedbackAttachmentSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attachment && !data.uploadSessionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Upload session is required with a screenshot',
        path: ['attachment'],
      })
    }
    if (!data.attachment && data.uploadSessionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Remove upload session or add a screenshot',
        path: ['uploadSessionId'],
      })
    }
  })

export type FeedbackType = z.infer<typeof feedbackTypeSchema>
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>
export type CreateFeedbackFormValues = z.infer<typeof createFeedbackFormSchema>
export type FeedbackAttachment = z.infer<typeof feedbackAttachmentSchema>
