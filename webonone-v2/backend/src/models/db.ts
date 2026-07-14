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
  // Do not retain idle connections that can go stale between requests.
  pool: { min: 0, max: 10 },
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

export interface SystemThemeRow {
  id: string
  name: string
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
  created_by: string
  is_system: boolean | number
  created_at: Date
  updated_at: Date
}

export interface UserPreferenceRow {
  user_id: string
  active_theme_id: string
  color_mode: 'light' | 'dark'
  updated_at: Date
}
