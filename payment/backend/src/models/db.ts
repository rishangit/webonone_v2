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

export type PaymentRole = 'super_admin' | 'company_admin' | 'member'

export type CompanyStatus = 'active' | 'inactive'
export type SubscriptionStatus = 'active' | 'cancelled'
export type InvoiceKind = 'system_subscription'
export type InvoiceStatus = 'issued' | 'paid' | 'overdue' | 'void' | 'pending_verification'
export type PlanInterval = 'month'

export interface PaymentCompanyRow {
  id: string
  name: string
  logo_url: string | null
  activated_at: Date | null
  status: CompanyStatus
  created_at: Date
  updated_at: Date
}

export interface PaymentPlanRow {
  id: string
  slug: string
  name: string
  amount_minor: number | string
  currency: string
  interval: PlanInterval
  active: number | boolean
  created_at: Date
  updated_at: Date
}

export interface PaymentSubscriptionRow {
  id: string
  company_id: string
  plan_id: string
  activated_at: Date
  status: SubscriptionStatus
  cancelled_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface PaymentInvoiceRow {
  id: string
  invoice_number: string
  payment_reference: string
  company_id: string
  subscription_id: string
  kind: InvoiceKind
  status: InvoiceStatus
  currency: string
  amount_minor: number | string
  period_start: Date
  period_end: Date
  issued_at: Date
  due_at: Date
  paid_at: Date | null
  voided_at: Date | null
  notes: string | null
  receipt_media_id: string | null
  receipt_url: string | null
  receipt_file_name: string | null
  receipt_uploaded_at: Date | null
  receipt_uploaded_by: string | null
  created_at: Date
  updated_at: Date
}

export interface PaymentInvoiceLineRow {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_amount_minor: number | string
  amount_minor: number | string
  created_at: Date
}

export interface PaymentAuditLogRow {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata_json: string | Record<string, unknown> | null
  created_at: Date
}

export const PLATFORM_MONTHLY_PLAN_SLUG = 'platform_monthly'
