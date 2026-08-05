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
  DB_NAME: z.string().default('webonone_design'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  DESIGN_PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  DESIGN_SERVICE_API_KEY: z.string().optional(),
  FRONTEND_BASE_URL: z.string().default('http://localhost:3019'),
  WEBONONE_API_BASE_URL: z.string().optional(),
  WEBONONE_SERVICE_API_KEY: z.string().optional(),
  IDENTITY_API_BASE_URL: z.string().optional(),
  IDENTITY_SERVICE_API_KEY: z.string().optional(),
  DATA_API_BASE_URL: z.string().optional(),
  DATA_SERVICE_API_KEY: z.string().optional(),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.DESIGN_PORT ?? 4019)

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
  designServiceApiKey: parsed.DESIGN_SERVICE_API_KEY ?? '',
  frontendBaseUrl: parsed.FRONTEND_BASE_URL,
  webononeApiBaseUrl: parsed.WEBONONE_API_BASE_URL?.trim() || 'http://127.0.0.1:4010',
  webononeServiceApiKey: parsed.WEBONONE_SERVICE_API_KEY?.trim() ?? '',
  identityApiBaseUrl: parsed.IDENTITY_API_BASE_URL?.trim() || 'http://127.0.0.1:4011',
  identityServiceApiKey: parsed.IDENTITY_SERVICE_API_KEY?.trim() ?? '',
  dataApiBaseUrl: parsed.DATA_API_BASE_URL?.trim() || 'http://127.0.0.1:4015',
  dataServiceApiKey: parsed.DATA_SERVICE_API_KEY?.trim() ?? '',
}
