import { z } from 'zod'

export const registerDeviceBodySchema = z.object({
  name: z.string().min(1).max(255).optional().default('Gateway device'),
  simSlots: z.array(z.unknown()).optional(),
  appVersion: z.string().max(32).optional(),
})

export type RegisterDeviceBody = z.infer<typeof registerDeviceBodySchema>

export const heartbeatBodySchema = z.object({
  appVersion: z.string().max(32).optional(),
  simSlots: z.array(z.unknown()).optional(),
})

export type HeartbeatBody = z.infer<typeof heartbeatBodySchema>

export const deviceMessagesQuerySchema = z.object({
  max: z.coerce.number().int().min(1).max(20).default(5),
})

export type DeviceMessagesQuery = z.infer<typeof deviceMessagesQuerySchema>

export const deviceStatusBodySchema = z.object({
  status: z.enum(['sent', 'failed']),
  simSlot: z.coerce.number().int().min(0).optional(),
  providerMessageRef: z.string().max(255).optional(),
  error: z.string().max(512).optional(),
})

export type DeviceStatusBody = z.infer<typeof deviceStatusBodySchema>
