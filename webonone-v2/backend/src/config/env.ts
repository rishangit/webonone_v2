import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '../..')
dotenv.config({ path: path.resolve(backendRoot, '.env') })

const envSchema = z.object({
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('webonon_v2'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  PORT: z.coerce.number().optional(),
  WEBONONE_PORT: z.coerce.number().optional(),
})

const parsed = envSchema.parse(process.env)

export const env = {
  database: {
    host: parsed.DB_HOST,
    port: parsed.DB_PORT,
    user: parsed.DB_USER,
    password: parsed.DB_PASSWORD,
    database: parsed.DB_NAME,
  },
  jwtSecret: parsed.JWT_SECRET,
  port: parsed.PORT ?? parsed.WEBONONE_PORT ?? 4000,
  jwtIssuer: 'webonone-identity',
  jwtAudience: 'webonone-api',
}
