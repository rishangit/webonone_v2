import { z } from 'zod'

export const upsertBrandingBodySchema = z.object({
  name: z.string().max(255).optional(),
  logoUrl: z.string().url().max(2048).nullable().optional(),
  primaryColor: z.string().max(32).nullable().optional(),
  contactEmail: z.string().email().max(255).nullable().optional(),
  footerHtml: z.string().nullable().optional(),
})

export type UpsertBrandingBody = z.infer<typeof upsertBrandingBodySchema>
