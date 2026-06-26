import knex from 'knex'
import { env } from '../config/env.js'

export const db = knex({
  client: 'mysql2',
  connection: env.database,
})
