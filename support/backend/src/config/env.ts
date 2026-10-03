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
  DB_NAME: z.string().default('webonone_support'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  FRONTEND_BASE_URL: z.string().default('http://127.0.0.1:3021'),
  MEDIA_API_BASE_URL: z.string().url().default('http://127.0.0.1:4013/api/v1'),
  EMAIL_API_BASE_URL: z.string().optional(),
  EMAIL_SERVICE_API_KEY: z.string().optional(),
  /** Platform default inbox — same value as Identity / WebOnOne (production.env SUPER_ADMIN_EMAIL). */
  SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@webonone.local'),
  /** Long-lived key for /feedback-fix MCP + watcher (header X-Support-Feedback-Automation-Key). */
  SUPPORT_FEEDBACK_AUTOMATION_API_KEY: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(32).optional(),
  ),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted ? Number(process.env.PORT) : (parsed.PORT ?? 4021)

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
  frontendBaseUrl: parsed.FRONTEND_BASE_URL,
  mediaApiBaseUrl: parsed.MEDIA_API_BASE_URL,
  emailApiBaseUrl: parsed.EMAIL_API_BASE_URL?.trim() ?? '',
  emailServiceApiKey: parsed.EMAIL_SERVICE_API_KEY?.trim() ?? '',
  superAdminEmail: parsed.SUPER_ADMIN_EMAIL,
  feedbackAutomationApiKey: parsed.SUPPORT_FEEDBACK_AUTOMATION_API_KEY?.trim() ?? '',
}
