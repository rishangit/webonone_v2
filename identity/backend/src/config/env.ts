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
  PASSWORD_RESET_EXPIRY_HOURS: z.coerce.number().default(1),
  ACCESS_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(86400),
  REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().default(7),
  GOOGLE_CLIENT_ID: z.string().optional(),
  ALLOWED_REDIRECT_URIS: z.string().default('http://localhost:*'),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.IDENTITY_PORT ?? 4001)

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
  passwordResetExpiryHours: parsed.PASSWORD_RESET_EXPIRY_HOURS,
  accessTokenExpirySeconds: parsed.ACCESS_TOKEN_EXPIRY_SECONDS,
  refreshTokenExpiryDays: parsed.REFRESH_TOKEN_EXPIRY_DAYS,
  jwtIssuer: 'webonone-identity',
  jwtAudience: 'webonone-api',
  googleClientId: parsed.GOOGLE_CLIENT_ID ?? '',
  allowedRedirectUris: parsed.ALLOWED_REDIRECT_URIS.split(',')
    .map((uri) => uri.trim())
    .filter(Boolean),
}
