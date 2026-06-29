import { z } from 'zod'

export const providerTestBodySchema = z.object({
  toEmail: z.string().email().optional(),
})

export type ProviderTestBody = z.infer<typeof providerTestBodySchema>
