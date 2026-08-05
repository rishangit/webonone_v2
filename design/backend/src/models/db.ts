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

export type DesignRole = 'super_admin' | 'company_admin' | 'member'
export type FormTemplateStatus = 'draft' | 'published'

export interface DesignFormTemplateRow {
  id: string
  company_id: string
  name: string
  slug: string
  definition: string | Record<string, unknown>
  status: FormTemplateStatus
  created_by: string | null
  created_at: Date
  updated_at: Date
}

export interface DesignFormSubmissionRow {
  id: string
  company_id: string
  form_template_id: string
  subject_user_id: string
  filled_by_user_id: string
  service_id: string | null
  answers: string | Record<string, unknown>
  created_at: Date
}
