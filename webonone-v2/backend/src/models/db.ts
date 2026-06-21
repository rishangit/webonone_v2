import knex from 'knex'
import { env } from '../config/env.js'

export const db = knex({
  client: 'mysql2',
  connection: env.database,
})

export interface SiteMediaRefRow {
  id: string
  site_id: string
  media_id: string
  media_url: string
  label: string | null
  created_at: Date
  updated_at: Date
}
