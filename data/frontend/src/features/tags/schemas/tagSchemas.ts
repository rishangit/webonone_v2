import { z } from 'zod'

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be #RRGGBB'),
  status: z.enum(['verified', 'pending']),
})

export type TagFormValues = z.infer<typeof tagFormSchema>
