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

export const pushDeviceBodySchema = z.object({
  token: z.string().min(16).max(255),
  platform: z.enum(['android', 'ios']),
})

export const unregisterPushDeviceBodySchema = z.object({
  token: z.string().min(16).max(255),
})

export const adminBroadcastPushBodySchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().max(4000).nullable().optional(),
  href: z.string().max(512).nullable().optional(),
})

export type CreateNotificationBody = z.infer<typeof createNotificationBodySchema>
export type PushDeviceBody = z.infer<typeof pushDeviceBodySchema>
export type UnregisterPushDeviceBody = z.infer<typeof unregisterPushDeviceBodySchema>
export type AdminBroadcastPushBody = z.infer<typeof adminBroadcastPushBodySchema>
