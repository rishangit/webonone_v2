import { z } from 'zod'

export const createNotificationBodySchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1).nullable().optional(),
  type: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  body: z.string().max(4000).nullable().optional(),
  href: z.string().max(512).nullable().optional(),
  sourceService: z.string().min(1).max(32),
  sourceEventId: z.string().min(1).max(128).nullable().optional(),
})

export const createNotificationsBatchBodySchema = z.object({
  items: z.array(createNotificationBodySchema).min(1).max(100),
})

export const internalCreateNotificationBodySchema = z.union([
  createNotificationBodySchema,
  createNotificationsBatchBodySchema,
])

export type CreateNotificationBody = z.infer<typeof createNotificationBodySchema>
