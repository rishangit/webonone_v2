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
  DB_NAME: z.string().default('webonone_media'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  MEDIA_PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  MEDIA_STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  MEDIA_LOCAL_STORAGE_PATH: z.string().default('./storage'),
  MEDIA_S3_BUCKET: z.string().optional(),
  MEDIA_S3_REGION: z.string().optional(),
  MEDIA_PUBLIC_BASE_URL: z.string().default('http://localhost:4003/api/v1'),
  MEDIA_MAX_FILE_SIZE_BYTES: z.coerce.number().default(26214400),
  MEDIA_ALLOWED_MIME_TYPES: z.string().default('image/*,video/*,application/pdf,text/plain'),
  ALLOWED_PARENT_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.MEDIA_PORT ?? 4003)

if (iisHosted && !Number.isFinite(port)) {
  throw new Error('IIS HttpPlatformHandler must set PORT (use %HTTP_PLATFORM_PORT% in web.config)')
}

function parseAllowlist(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function parseMimeAllowlist(value: string): string[] {
  return parseAllowlist(value)
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
  storageDriver: parsed.MEDIA_STORAGE_DRIVER,
  localStoragePath: path.resolve(backendRoot, parsed.MEDIA_LOCAL_STORAGE_PATH),
  s3Bucket: parsed.MEDIA_S3_BUCKET,
  s3Region: parsed.MEDIA_S3_REGION,
  publicBaseUrl: parsed.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, ''),
  maxFileSizeBytes: parsed.MEDIA_MAX_FILE_SIZE_BYTES,
  allowedMimeTypes: parseMimeAllowlist(parsed.MEDIA_ALLOWED_MIME_TYPES),
  allowedParentOrigins: parseAllowlist(parsed.ALLOWED_PARENT_ORIGINS),
}
