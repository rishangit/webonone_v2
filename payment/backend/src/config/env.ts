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
  DB_NAME: z.string().default('webonone_payment'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  PAYMENT_PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  PAYMENT_SERVICE_API_KEY: z.string().optional(),
  SYSTEM_MONTHLY_AMOUNT_LKR: z.coerce.number().default(3000),
  BILLING_TIMEZONE: z.string().default('Asia/Colombo'),
  INVOICE_GENERATOR_INTERVAL_MS: z.coerce.number().default(3_600_000),
  INVOICE_DUE_DAYS: z.coerce.number().default(14),
  FRONTEND_BASE_URL: z.string().default('http://localhost:3017'),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.PAYMENT_PORT ?? 4017)

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
  paymentServiceApiKey: parsed.PAYMENT_SERVICE_API_KEY ?? '',
  systemMonthlyAmountLkr: parsed.SYSTEM_MONTHLY_AMOUNT_LKR,
  systemMonthlyAmountMinor: Math.round(parsed.SYSTEM_MONTHLY_AMOUNT_LKR * 100),
  billingTimezone: parsed.BILLING_TIMEZONE,
  invoiceGeneratorIntervalMs: parsed.INVOICE_GENERATOR_INTERVAL_MS,
  invoiceDueDays: parsed.INVOICE_DUE_DAYS,
  frontendBaseUrl: parsed.FRONTEND_BASE_URL,
}
