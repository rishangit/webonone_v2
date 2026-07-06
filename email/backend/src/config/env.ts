import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iisHosted = process.env.IIS_NODE_HOSTED === '1'
const iisPort = process.env.PORT
const backendRoot = path.resolve(__dirname, '../..')
const envPath = iisHosted
  ? path.resolve(backendRoot, '../backend/.env')
  : path.resolve(backendRoot, '.env')

dotenv.config({ path: envPath })
if (iisHosted && iisPort) {
  process.env.PORT = iisPort
}

const envSchema = z.object({
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('webonone_email'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  EMAIL_SERVICE_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM_ADDRESS: z.string().default('noreply@example.com'),
  SMTP_FROM_NAME: z.string().default('WebOnOne'),
  SMTP_TLS_REJECT_UNAUTHORIZED: z
    .string()
    .default('true')
    .transform((v) => v !== 'false' && v !== '0'),
  FRONTEND_BASE_URL: z.string().default('http://localhost:3014'),
  QUEUE_WORKER_INTERVAL_MS: z.coerce.number().default(5000),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.EMAIL_PORT ?? 4014)

if (iisHosted && !Number.isFinite(port)) {
  throw new Error('IIS HttpPlatformHandler must set PORT (use %HTTP_PLATFORM_PORT% in web.config)')
}

export const env = {
  database: {
    host: parsed.DB_HOST,
    port: parsed.DB_PORT,
    user: parsed.DB_USER,
    password: parsed.DB_PASSWORD,
    database: parsed.DB_NAME,
  },
  jwtSecret: parsed.JWT_SECRET,
  jwtIssuer: 'webonone-identity',
  jwtAudience: 'webonone-api',
  host: parsed.HOST,
  port,
  iisHosted,
  emailServiceApiKey: parsed.EMAIL_SERVICE_API_KEY ?? '',
  smtp: {
    host: parsed.SMTP_HOST,
    port: parsed.SMTP_PORT,
    secure: parsed.SMTP_SECURE,
    user: parsed.SMTP_USER,
    password: parsed.SMTP_PASSWORD,
    fromAddress: parsed.SMTP_FROM_ADDRESS,
    fromName: parsed.SMTP_FROM_NAME,
    tlsRejectUnauthorized: parsed.SMTP_TLS_REJECT_UNAUTHORIZED,
  },
  frontendBaseUrl: parsed.FRONTEND_BASE_URL,
  queueWorkerIntervalMs: parsed.QUEUE_WORKER_INTERVAL_MS,
}
