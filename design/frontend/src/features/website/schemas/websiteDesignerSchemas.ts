import { z } from 'zod'
import { MIN_PAGE_CONTAINER_HEIGHT } from '../document/layout'

export function createContainerSettingsSchema(minHeight: number) {
  return z.object({
    height: z.coerce
      .number({ invalid_type_error: 'Height is required' })
      .min(minHeight, `Height must be at least ${minHeight}`)
      .max(20000, 'Height must be at most 20000'),
    backgroundColor: z.string().max(32).optional(),
  })
}

export const containerSettingsSchema = createContainerSettingsSchema(MIN_PAGE_CONTAINER_HEIGHT)

export const blockSettingsSchema = z.object({
  backgroundColor: z.string().max(32).optional(),
})

export type ContainerSettingsValues = z.infer<typeof containerSettingsSchema>
export type BlockSettingsValues = z.infer<typeof blockSettingsSchema>
