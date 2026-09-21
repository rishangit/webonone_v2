import { z } from 'zod'

export const pushBroadcastFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  body: z.string().trim().max(4000).optional(),
  href: z.string().trim().max(512).optional(),
})

export type PushBroadcastFormValues = z.infer<typeof pushBroadcastFormSchema>
