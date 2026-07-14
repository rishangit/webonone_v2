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
