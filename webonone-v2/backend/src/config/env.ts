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
  DATA_API_BASE_URL: z.string().optional(),
  DATA_SERVICE_API_KEY: z.string().optional(),
  IDENTITY_API_BASE_URL: z.string().optional(),
  IDENTITY_SERVICE_API_KEY: z.string().optional(),
  IDENTITY_DB_NAME: z.string().default('identity'),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.WEBONONE_PORT ?? 4000)

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
  jwtIssuer: 'webonone-identity',
  jwtAudience: 'webonone-api',
  superAdminEmail: parsed.SUPER_ADMIN_EMAIL,
  superAdminDisplayName: parsed.SUPER_ADMIN_DISPLAY_NAME,
  superAdminUserId: parsed.SUPER_ADMIN_USER_ID?.trim() ?? '',
  emailApiBaseUrl: parsed.EMAIL_API_BASE_URL ?? '',
  emailServiceApiKey: parsed.EMAIL_SERVICE_API_KEY ?? '',
  dataApiBaseUrl: parsed.DATA_API_BASE_URL ?? '',
  dataServiceApiKey: parsed.DATA_SERVICE_API_KEY ?? '',
  identityApiBaseUrl: parsed.IDENTITY_API_BASE_URL ?? 'http://localhost:4001',
  identityServiceApiKey: parsed.IDENTITY_SERVICE_API_KEY ?? 'dev-identity-service-key',
  identityDbName: parsed.IDENTITY_DB_NAME,
}
