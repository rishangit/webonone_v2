import { z } from 'zod'

const phoneNumber = z
  .string()
  .min(5)
  .max(32)
  .regex(/^\+?[0-9\s-]{5,31}$/, 'Invalid phone number')

const gatewayModeSchema = z.enum(['mobile_device', 'text_lk'])

export const updateGatewayBodySchema = z
  .object({
    mode: gatewayModeSchema,
    senderId: z.string().trim().min(1).max(11).optional(),
    apiToken: z.string().trim().min(1).max(512).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'text_lk') {
      if (!data.senderId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sender ID is required for Text.lk',
          path: ['senderId'],
        })
      }
      // apiToken optional when rotating is not needed (existing token kept)
    }
  })

export type UpdateGatewayBody = z.infer<typeof updateGatewayBodySchema>

export const testGatewayBodySchema = z.object({
  toNumber: phoneNumber,
})

export type TestGatewayBody = z.infer<typeof testGatewayBodySchema>
