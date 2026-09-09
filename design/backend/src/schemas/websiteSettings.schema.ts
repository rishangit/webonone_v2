import { z } from 'zod'

export const updateWebsiteSettingsSchema = z.object({
  homePageId: z.string().min(1).nullable(),
})

export type UpdateWebsiteSettingsBody = z.infer<typeof updateWebsiteSettingsSchema>
