import knex from 'knex'
import { env } from '../config/env.js'

export const db = knex({
  client: 'mysql2',
  connection: env.database,
})

export type DataRole = 'super_admin' | 'company_admin' | 'member'
export type EntityStatus = 'verified' | 'pending'
export type AttributeValueType = 'number' | 'text'

export interface TagRow {
  id: string
  name: string
  description: string | null
  color: string
  status: EntityStatus
  created_at: Date
  updated_at: Date
}

export interface UnitRow {
  id: string
  name: string
  description: string | null
  symbol: string
  base_unit_id: string | null
  is_base: boolean
  status: EntityStatus
  created_at: Date
  updated_at: Date
}

export interface AttributeRow {
  id: string
  name: string
  description: string | null
  value_type: AttributeValueType
  unit_id: string | null
  status: EntityStatus
  created_at: Date
  updated_at: Date
}

export interface CatalogRow {
  id: string
  name: string
  description: string | null
  status: EntityStatus
  created_at: Date
  updated_at: Date
}
