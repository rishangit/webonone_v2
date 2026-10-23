import { z } from 'zod'

/** Canvas outline is sent with the user prompt, so this must fit both. */
export const CHAT_MESSAGE_MAX_CHARS = 200_000

export const nanoidIdSchema = z.string().length(21)

/** Platform Design library ids (seeded `lib-button-primary` plus nanoid creates). */
export const designLibraryIdSchema = z.string().trim().min(8).max(32)

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

const webononeEntityKindSchema = z.enum([
  'product',
  'service',
  'space',
  'staff',
  'event',
  'company',
])

const designEntityKindSchema = z.enum(['button', 'text'])

export const dataEntityContextRefSchema = z
  .object({
    service: z.literal('data'),
    kind: dataEntityKindSchema,
    id: nanoidIdSchema,
    label: z.string().trim().min(1).max(255).optional(),
  })
  .strict()

export const webononeCatalogEntityContextRefSchema = z
  .object({
    service: z.literal('webonone'),
    kind: webononeEntityKindSchema,
    id: nanoidIdSchema,
    label: z.string().trim().min(1).max(255).optional(),
  })
  .strict()

/** @deprecated Alias — kinds now include staff, event, and company. */
export const webononeEntityContextRefSchema = webononeCatalogEntityContextRefSchema

export const designEntityContextRefSchema = z
  .object({
    service: z.literal('design'),
    kind: designEntityKindSchema,
    id: designLibraryIdSchema,
    label: z.string().trim().min(1).max(255).optional(),
  })
  .strict()

export const entityContextRefSchema = z.discriminatedUnion('service', [
  dataEntityContextRefSchema,
  webononeCatalogEntityContextRefSchema,
  designEntityContextRefSchema,
])

export const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_CHARS),
    context: z.array(entityContextRefSchema).max(8).optional(),
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
