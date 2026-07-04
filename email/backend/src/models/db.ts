import knex from 'knex'
import { env } from '../config/env.js'

export const db = knex({
  client: 'mysql2',
  connection: env.database,
})

export type EmailRole = 'super_admin' | 'company_admin' | 'member'

export interface EmailUserRow {
  id: string
  email: string
  display_name: string
  created_at: Date
  updated_at: Date
}

export interface EmailCompanyRow {
  id: string
  name: string
  created_at: Date
  updated_at: Date
}

export type TemplateScope = 'platform' | 'company'
export type QueueStatus = 'pending' | 'processing' | 'sent' | 'failed'
export type HistoryStatus = 'sent' | 'failed'

export interface EmailTemplateRow {
  id: string
  slug: string
  name: string
  subject: string
  html_body: string
  text_body: string
  scope: TemplateScope
  company_id: string | null
  is_active: boolean
  required_keys: string | string[] | null
  created_at: Date
  updated_at: Date
}

export interface EmailTemplateVersionRow {
  id: string
  template_id: string
  subject: string
  html_body: string
  text_body: string
  version_number: number
  created_by: string | null
  created_at: Date
}

export interface EmailCompanyBrandingRow {
  company_id: string
  name: string
  logo_url: string | null
  primary_color: string | null
  contact_email: string | null
  footer_html: string | null
  created_at: Date
  updated_at: Date
}

export interface EmailProviderRow {
  id: string
  name: string
  host: string
  port: number
  secure: boolean
  from_address: string
  from_name: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface EmailQueueRow {
  id: string
  template_slug: string
  to_email: string
  payload_json: string | Record<string, string>
  company_id: string | null
  status: QueueStatus
  retry_count: number
  max_retries: number
  priority: number
  scheduled_at: Date
  processed_at: Date | null
  last_error: string | null
  created_at: Date
}

export interface EmailHistoryRow {
  id: string
  queue_id: string | null
  status: HistoryStatus
  provider_message_id: string | null
  sent_at: Date
  recipient: string
  template_slug: string
  company_id: string | null
  error_message: string | null
  created_at: Date
}

export interface EmailAuditLogRow {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata_json: string | Record<string, unknown> | null
  created_at: Date
}
