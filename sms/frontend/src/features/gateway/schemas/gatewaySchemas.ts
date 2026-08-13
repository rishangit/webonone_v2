import { z } from 'zod'

const gatewayModeSchema = z.enum(['mobile_device', 'text_lk'])

export const gatewaySettingsSchema = z
  .object({
    mode: gatewayModeSchema,
    senderId: z.string().trim().max(11).optional().or(z.literal('')),
    apiToken: z.string().trim().max(512).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'text_lk') {
      if (!data.senderId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sender ID is required for Text.lk',
          path: ['senderId'],
        })
      }
    }
  })

export type GatewaySettingsFormValues = z.infer<typeof gatewaySettingsSchema>

export const gatewayTestSchema = z.object({
  toNumber: z
    .string()
    .min(5, 'Phone number is required')
    .max(32)
    .regex(/^\+?[0-9\s-]{5,31}$/, 'Invalid phone number'),
})

export type GatewayTestFormValues = z.infer<typeof gatewayTestSchema>
