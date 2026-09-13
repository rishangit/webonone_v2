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

export const elementChromeSchema = z.object({
  backgroundColor: z.string().max(32).optional(),
  borderColor: z.string().max(32).optional(),
  borderRadius: z.enum(['sm', 'md', 'lg', 'xl', 'full']).optional(),
  boxShadow: z.enum(['sm', 'md', 'lg']).optional(),
  padding: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  margin: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
})

export const blockSettingsSchema = elementChromeSchema.extend({
  groupName: z.string().trim().max(64).optional(),
  dataBinding: z
    .object({
      datasetId: z.string().max(21).nullable(),
      itemGroup: z.string().max(64).nullable().optional(),
      itemGap: z.coerce.number().min(0).max(2000).optional(),
      itemsPath: z.string().max(128).nullable().optional(),
    })
    .optional(),
})

export type ContainerSettingsValues = z.infer<typeof containerSettingsSchema>
export type ElementChromeValues = z.infer<typeof elementChromeSchema>
export type BlockSettingsValues = z.infer<typeof blockSettingsSchema>
