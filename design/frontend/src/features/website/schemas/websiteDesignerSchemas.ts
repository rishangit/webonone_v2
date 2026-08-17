import { z } from 'zod'

export const containerSettingsSchema = z.object({
  height: z.coerce
    .number({ invalid_type_error: 'Height is required' })
    .min(80, 'Height must be at least 80')
    .max(20000, 'Height must be at most 20000'),
  backgroundColor: z.string().max(32).optional(),
})

export const blockSettingsSchema = z.object({
  backgroundColor: z.string().max(32).optional(),
})

export type ContainerSettingsValues = z.infer<typeof containerSettingsSchema>
export type BlockSettingsValues = z.infer<typeof blockSettingsSchema>
