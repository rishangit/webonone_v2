import path from 'path'
import { fileURLToPath } from 'url'
import type { Knex } from 'knex'
import { env } from './env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '../..')

export const knexConfig: Knex.Config = {
  client: 'mysql2',
  connection: env.database,
  migrations: {
    directory: path.join(backendRoot, 'migrations'),
    extension: 'ts',
  },
}
