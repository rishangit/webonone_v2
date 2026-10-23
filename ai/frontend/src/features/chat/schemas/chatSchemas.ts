import { z } from 'zod'

const CHAT_MESSAGE_MAX_CHARS = 200_000

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_CHARS),
})

export type SendMessageValues = z.infer<typeof sendMessageSchema>
