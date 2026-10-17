import { z } from 'zod'

export const copyWebsiteLibrarySchema = z.object({
  libraryId: z.string().trim().length(21),
})

export type CopyWebsiteLibraryBody = z.infer<typeof copyWebsiteLibrarySchema>
