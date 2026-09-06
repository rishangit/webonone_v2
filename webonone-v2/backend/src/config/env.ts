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
  DB_NAME: z.string().default('webonone_v2'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  WEBONONE_PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@webonone.local'),
  SUPER_ADMIN_DISPLAY_NAME: z.string().default('Super Admin'),
  SUPER_ADMIN_USER_ID: z.string().optional(),
  EMAIL_API_BASE_URL: z.string().optional(),
  EMAIL_SERVICE_API_KEY: z.string().optional(),
  SMS_API_BASE_URL: z.string().optional(),
  SMS_SERVICE_API_KEY: z.string().optional(),
  PAYMENT_API_BASE_URL: z.string().optional(),
  PAYMENT_SERVICE_API_KEY: z.string().optional(),
  DATA_API_BASE_URL: z.string().optional(),
  DATA_SERVICE_API_KEY: z.string().optional(),
  WEBONONE_SERVICE_API_KEY: z.string().optional(),
  IDENTITY_API_BASE_URL: z.string().optional(),
  IDENTITY_SERVICE_API_KEY: z.string().optional(),
  IDENTITY_DB_NAME: z.string().default('identity'),
  COMPANY_SITE_HOST: z.string().default('live.webonone.com'),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.WEBONONE_PORT ?? 4010)

if (iisHosted && !Number.isFinite(port)) {
  throw new Error('IIS HttpPlatformHandler must set PORT (use %HTTP_PLATFORM_PORT% in web.config)')
}

const identityApiBaseUrl = parsed.IDENTITY_API_BASE_URL?.trim() ?? ''
const identityServiceApiKey = parsed.IDENTITY_SERVICE_API_KEY?.trim() ?? ''

if (iisHosted) {
  if (!identityApiBaseUrl) {
    throw new Error('IDENTITY_API_BASE_URL is required when IIS_NODE_HOSTED=1')
  }
  if (/^https?:\/\/localhost(:\d+)?$/i.test(identityApiBaseUrl)) {
    throw new Error('IDENTITY_API_BASE_URL must not point at localhost in production')
  }
  if (!identityServiceApiKey) {
    throw new Error('IDENTITY_SERVICE_API_KEY is required when IIS_NODE_HOSTED=1')
  }
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
  host: parsed.HOST,
  port,
  iisHosted,
  jwtIssuer: 'webonone-identity',
  jwtAudience: 'webonone-api',
  superAdminEmail: parsed.SUPER_ADMIN_EMAIL,
  superAdminDisplayName: parsed.SUPER_ADMIN_DISPLAY_NAME,
  superAdminUserId: parsed.SUPER_ADMIN_USER_ID?.trim() ?? '',
  emailApiBaseUrl: parsed.EMAIL_API_BASE_URL ?? '',
  emailServiceApiKey: parsed.EMAIL_SERVICE_API_KEY ?? '',
  smsApiBaseUrl: parsed.SMS_API_BASE_URL ?? '',
  smsServiceApiKey: parsed.SMS_SERVICE_API_KEY ?? '',
  paymentApiBaseUrl: parsed.PAYMENT_API_BASE_URL ?? '',
  paymentServiceApiKey: parsed.PAYMENT_SERVICE_API_KEY ?? '',
  dataApiBaseUrl: parsed.DATA_API_BASE_URL ?? '',
  dataServiceApiKey: parsed.DATA_SERVICE_API_KEY ?? '',
  webononeServiceApiKey: parsed.WEBONONE_SERVICE_API_KEY?.trim() ?? '',
  identityApiBaseUrl: identityApiBaseUrl || 'http://localhost:4011',
  identityServiceApiKey: identityServiceApiKey || 'dev-identity-service-key',
  identityDbName: parsed.IDENTITY_DB_NAME,
  companySiteHost:
    parsed.COMPANY_SITE_HOST.replace(/^https?:\/\//, '').replace(/^www\./i, '').replace(/\/.*$/, '') ||
    'live.webonone.com',
}
