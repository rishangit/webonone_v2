import { z } from 'zod'

const dateYmd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'occurrenceDate must be YYYY-MM-DD')

export const createSubmissionBodySchema = z.object({
  formTemplateId: z.string().length(21),
  subjectUserId: z.string().length(21),
  serviceId: z.string().length(21).optional().nullable(),
  eventId: z.string().length(21).optional().nullable(),
  occurrenceDate: dateYmd.optional().nullable(),
  sessionTokenId: z.string().length(21).optional().nullable(),
  answers: z.record(z.string(), z.unknown()),
})

export type CreateSubmissionBody = z.infer<typeof createSubmissionBodySchema>
