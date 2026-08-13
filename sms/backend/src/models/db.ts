import knex from 'knex'
import { env } from '../config/env.js'

export const db = knex({
  client: 'mysql2',
  connection: {
    ...env.database,
    // Keep pooled TCP sockets alive so MySQL/OS does not silently drop idle
    // connections and cause intermittent ECONNRESET on the next query.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  },
  pool: { min: 0, max: 10 },
})

export type SmsRole = 'super_admin' | 'company_admin' | 'member'

export type DeviceScope = 'platform' | 'company'
export type DeviceStatus = 'pending' | 'approved' | 'revoked'
export type TemplateScope = 'platform' | 'company'
export type QueueStatus = 'pending' | 'processing' | 'sent' | 'failed'
export type HistoryStatus = 'sent' | 'failed'
export type GatewayMode = 'mobile_device' | 'text_lk'

export interface SmsGatewayConfigRow {
  id: string
  scope: DeviceScope
  company_id: string | null
  mode: GatewayMode
  sender_id: string | null
  api_token_enc: string | null
  updated_by: string | null
  updated_at: Date
  created_at: Date
}

export interface SmsUserRow {
  id: string
  email: string
  display_name: string
  created_at: Date
  updated_at: Date
}

export interface SmsCompanyRow {
  id: string
  name: string
  created_at: Date
  updated_at: Date
}

export interface SmsDeviceRow {
  id: string
  name: string
  owner_user_id: string
  scope: DeviceScope
  company_id: string | null
  device_key_hash: string
  status: DeviceStatus
  sim_slots: string | unknown[] | null
  app_version: string | null
  last_seen_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface SmsTemplateRow {
  id: string
  slug: string
  name: string
  body: string
  scope: TemplateScope
  company_id: string | null
  is_active: boolean
  required_keys: string | string[] | null
  created_at: Date
  updated_at: Date
}

export interface SmsTemplateVersionRow {
  id: string
  template_id: string
  body: string
  version_number: number
  created_by: string | null
  created_at: Date
}

export interface SmsQueueRow {
  id: string
  template_slug: string | null
  to_number: string
  body: string
  payload_json: string | Record<string, string>
  company_id: string | null
  scope: DeviceScope
  status: QueueStatus
  assigned_device_id: string | null
  sim_slot: number | null
  retry_count: number
  max_retries: number
  priority: number
  scheduled_at: Date
  dispatched_at: Date | null
  processed_at: Date | null
  last_error: string | null
  created_at: Date
}

export interface SmsHistoryRow {
  id: string
  queue_id: string | null
  to_number: string
  status: HistoryStatus
  device_id: string | null
  sim_slot: number | null
  provider_message_ref: string | null
  template_slug: string | null
  company_id: string | null
  error_message: string | null
  created_at: Date
}

export interface SmsOtpRow {
  id: string
  phone_number: string
  otp_hash: string
  purpose: string
  company_id: string | null
  expires_at: Date
  used_at: Date | null
  attempt_count: number
  created_at: Date
}

export interface SmsAuditLogRow {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata_json: string | Record<string, unknown> | null
  created_at: Date
}
