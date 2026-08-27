import { z } from 'zod'

export const nanoidIdSchema = z.string().length(21)

export const createConversationSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    companyId: z.unknown().optional(),
    userId: z.unknown().optional(),
    guestId: z.unknown().optional(),
  })
  .strict()

const dataEntityKindSchema = z.enum([
  'product',
  'service',
  'space',
  'tag',
  'unit',
  'attribute',
])

export const dataEntityContextRefSchema = z
  .object({
    service: z.literal('data'),
    kind: dataEntityKindSchema,
    id: nanoidIdSchema,
    label: z.string().trim().min(1).max(255).optional(),
  })
  .strict()

export const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(8000),
    context: z.array(dataEntityContextRefSchema).max(8).optional(),
    companyId: z.unknown().optional(),
    userId: z.unknown().optional(),
    guestId: z.unknown().optional(),
  })
  .strict()

export const confirmToolCallSchema = z
  .object({
    relatedSelections: z.record(z.boolean()).optional(),
    argumentOverrides: z.record(z.unknown()).optional(),
    relatedArgumentOverrides: z.record(z.record(z.unknown())).optional(),
  })
  .strict()
