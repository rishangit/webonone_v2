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
// HttpPlatformHandler sets PORT before Node starts; never let .env override it.
if (iisHosted && iisPort) {
  process.env.PORT = iisPort
}

const envSchema = z.object({
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('identity'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  IDENTITY_PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  ACCESS_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(604800),
  REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().default(7),
  GOOGLE_CLIENT_ID: z.string().optional(),
  ALLOWED_REDIRECT_URIS: z.string().default('http://localhost:*'),
  EMAIL_API_BASE_URL: z.string().optional(),
  EMAIL_SERVICE_API_KEY: z.string().optional(),
  SMS_API_BASE_URL: z.string().optional(),
  SMS_SERVICE_API_KEY: z.string().optional(),
  IDENTITY_FRONTEND_ORIGIN: z.string().default('http://localhost:3011'),
  EMAIL_VERIFICATION_EXPIRY_HOURS: z.coerce.number().default(24),
  SUPER_ADMIN_USER_ID: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@webonone.local'),
  SUPER_ADMIN_DISPLAY_NAME: z.string().default('Super Admin'),
  IDENTITY_SERVICE_API_KEY: z.string().default('dev-identity-service-key'),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.IDENTITY_PORT ?? 4011)

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
  host: parsed.HOST,
  port,
  iisHosted,
  accessTokenExpirySeconds: parsed.ACCESS_TOKEN_EXPIRY_SECONDS,
  refreshTokenExpiryDays: parsed.REFRESH_TOKEN_EXPIRY_DAYS,
  jwtIssuer: 'webonone-identity',
  jwtAudience: 'webonone-api',
  googleClientId: parsed.GOOGLE_CLIENT_ID ?? '',
  allowedRedirectUris: parsed.ALLOWED_REDIRECT_URIS.split(',')
    .map((uri) => uri.trim())
    .filter(Boolean),
  emailApiBaseUrl: parsed.EMAIL_API_BASE_URL ?? '',
  emailServiceApiKey: parsed.EMAIL_SERVICE_API_KEY ?? '',
  smsApiBaseUrl: parsed.SMS_API_BASE_URL ?? '',
  smsServiceApiKey: parsed.SMS_SERVICE_API_KEY ?? '',
  identityFrontendOrigin: parsed.IDENTITY_FRONTEND_ORIGIN.replace(/\/$/, ''),
  emailVerificationExpiryHours: parsed.EMAIL_VERIFICATION_EXPIRY_HOURS,
  superAdminUserId: parsed.SUPER_ADMIN_USER_ID?.trim() ?? '',
  superAdminEmail: parsed.SUPER_ADMIN_EMAIL,
  superAdminDisplayName: parsed.SUPER_ADMIN_DISPLAY_NAME,
  identityServiceApiKey: parsed.IDENTITY_SERVICE_API_KEY,
}
