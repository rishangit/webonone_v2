import { z } from 'zod'

export const libraryEntityReferenceCountsBodySchema = z.object({
  kind: z.enum(['products', 'services', 'spaces']),
  entityIds: z.array(z.string().length(21)).max(200),
})

export type LibraryEntityReferenceCountsBody = z.infer<
  typeof libraryEntityReferenceCountsBodySchema
>
