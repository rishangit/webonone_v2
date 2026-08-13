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
  DB_NAME: z.string().default('webonone_sms'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  SMS_PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  SMS_SERVICE_API_KEY: z.string().optional(),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  DEVICE_STALE_MS: z.coerce.number().default(120_000),
  PROCESSING_TIMEOUT_MS: z.coerce.number().default(120_000),
  QUEUE_WORKER_INTERVAL_MS: z.coerce.number().default(5000),
  FRONTEND_BASE_URL: z.string().default('http://localhost:3016'),
  /** 32-byte key as 64 hex chars or base64 — encrypts Text.lk API tokens at rest */
  SMS_GATEWAY_ENCRYPTION_KEY: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  ),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.SMS_PORT ?? 4016)

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
  smsServiceApiKey: parsed.SMS_SERVICE_API_KEY ?? '',
  otpTtlSeconds: parsed.OTP_TTL_SECONDS,
  otpMaxAttempts: parsed.OTP_MAX_ATTEMPTS,
  deviceStaleMs: parsed.DEVICE_STALE_MS,
  processingTimeoutMs: parsed.PROCESSING_TIMEOUT_MS,
  queueWorkerIntervalMs: parsed.QUEUE_WORKER_INTERVAL_MS,
  frontendBaseUrl: parsed.FRONTEND_BASE_URL,
  smsGatewayEncryptionKey: parsed.SMS_GATEWAY_ENCRYPTION_KEY,
}
