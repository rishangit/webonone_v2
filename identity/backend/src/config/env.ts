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
  DB_NAME: z.string().default('identity'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  PORT: z.coerce.number().optional(),
  IDENTITY_PORT: z.coerce.number().optional(),
  PASSWORD_RESET_EXPIRY_HOURS: z.coerce.number().default(1),
  ACCESS_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(900),
  REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().default(7),
  GOOGLE_CLIENT_ID: z.string().optional(),
  ALLOWED_REDIRECT_URIS: z.string().default('http://localhost:3000/callback'),
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
  port: parsed.PORT ?? parsed.IDENTITY_PORT ?? 4001,
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
