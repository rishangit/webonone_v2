import knex from 'knex'
import { env } from '../config/env.js'

export const db = knex({
  client: 'mysql2',
  connection: {
    ...env.database,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  },
  pool: { min: 0, max: 10 },
})

export type AiRole = 'super_admin' | 'company_admin' | 'member' | 'guest'

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'tool_result'

export interface AiConversationRow {
  id: string
  company_id: string | null
  user_id: string | null
  guest_id: string | null
  title: string | null
  created_at: Date
  updated_at: Date
}

export interface AiMessageRow {
  id: string
  conversation_id: string
  company_id: string | null
  role: MessageRole
  content: string
  tool_name: string | null
  tool_call_id: string | null
  tool_payload: string | Record<string, unknown> | null
  created_at: Date
}
