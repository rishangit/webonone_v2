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
  DB_NAME: z.string().default('webonone_ai'),
  JWT_SECRET: z.string().min(8).default('dev-jwt-secret-change-in-production'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().optional(),
  AI_PORT: z.coerce.number().optional(),
  IIS_NODE_HOSTED: z.string().optional(),
  FRONTEND_BASE_URL: z.string().default('http://127.0.0.1:3020'),
  WEBSITE_ORIGIN: z.string().default('http://127.0.0.1:3018'),
  WEBONONE_ORIGIN: z.string().default('http://127.0.0.1:3010'),
  ALLOWED_ORIGINS: z.string().optional(),
  AI_PROVIDER: z.enum(['ollama', 'openai', 'gemini', 'anthropic']).default('ollama'),
  AI_MODEL: z.string().default('llama3.2'),
  AI_PROVIDER_BASE_URL: z.string().default('http://127.0.0.1:11434'),
  AI_PROVIDER_API_KEY: z.string().optional(),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().default(60_000),
  AI_SYSTEM_PROMPT: z.string().optional(),
  AI_GUEST_TOKEN_EXPIRY_SECONDS: z.coerce.number().default(86_400),
  AI_GUEST_RATE_LIMIT_MAX: z.coerce.number().default(30),
  AI_GUEST_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  WEBONONE_API_BASE_URL: z.string().optional(),
  WEBONONE_SERVICE_API_KEY: z.string().optional(),
  DATA_API_BASE_URL: z.string().optional(),
  DATA_SERVICE_API_KEY: z.string().optional(),
  AI_CAPABILITY_REFRESH_MS: z.coerce.number().default(300_000),
  AI_TOOL_HTTP_TIMEOUT_MS: z.coerce.number().default(15_000),
})

const parsed = envSchema.parse(process.env)

const port = iisHosted
  ? Number(process.env.PORT)
  : (parsed.PORT ?? parsed.AI_PORT ?? 4020)

if (iisHosted && !Number.isFinite(port)) {
  throw new Error('IIS HttpPlatformHandler must set PORT (use %HTTP_PLATFORM_PORT% in web.config)')
}

const allowedOrigins = [
  parsed.ALLOWED_ORIGINS,
  parsed.FRONTEND_BASE_URL,
  parsed.WEBSITE_ORIGIN,
  parsed.WEBONONE_ORIGIN,
]
  .filter((value): value is string => Boolean(value))
  .flatMap((entry) => entry.split(','))
  .map((entry) => entry.trim().replace(/\/$/, ''))
  .filter((entry, index, all) => entry && all.indexOf(entry) === index)

export const DEFAULT_SYSTEM_PROMPT =
  'You are the WebOnOne assistant for company admins, super admins, and signed-in users. Use only the tools listed in this request. Platform Data library items (tags, units, attributes, products, services, spaces) use Data tools such as list_data_units and create_data_unit — never search_public_catalog for library units or tags. Units have a name and symbol (for example Metre / m); they have no length or weight category field. Company-admin Data creates stay pending until a super admin verifies them. Super-admin Data writes apply after confirmation. Company catalog, staff, and events tools apply only to the signed-in company session. Super-admin company approval uses list_pending_companies and approve_company, not the company catalog. Never claim a user identity, company, role, or permission. Never invent IDs. Names are not ids; foreign ids such as tag_ids must come from a list_* result or a known id. Do not call a write tool until you know the entity type, the action (create, update, attach/link, or delete), and the target record if the action is attach, update, or delete. If any of those is missing, reply with a short numbered list of the likely options and wait. Example: add clinic might be (1) a new Data library tag, (2) a product, (3) a service, or (4) attach an existing tag to a named item. Use the same pattern for any unclear request (units, attributes, staff, events, company catalog vs Data library). Reads (list_*) may run to populate choices. After the user picks, call the matching tool. If the user asks to suggest, recommend, or list names (for example 10 tags for a clinic), reply with a numbered list of complete suggestions and wait. Do not call create_* until they ask to add or create those items. When they ask to create several named items, call the matching create_* tool once per item in the same turn. When calling create_* tools, include every required schema property in the tool arguments. Copy name from the user message. Populate remaining descriptive properties (especially description, and color or symbol when present) with a complete user-facing suggestion so the user can confirm without guessing. Write a 1–3 sentence description. Do not omit name or description. Do not invent emails. Reads may run immediately. Writes and deletes only succeed after the user confirms in the chat UI — do not say a write succeeded until a tool result status is executed. If a tool is not listed, explain that it is unavailable. Do not browse arbitrary URLs or access databases directly.'

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
  guestJwtIssuer: 'webonone-ai',
  guestJwtAudience: 'webonone-ai',
  host: parsed.HOST,
  port,
  iisHosted,
  frontendBaseUrl: parsed.FRONTEND_BASE_URL,
  websiteOrigin: parsed.WEBSITE_ORIGIN.replace(/\/$/, ''),
  webononeOrigin: parsed.WEBONONE_ORIGIN.replace(/\/$/, ''),
  allowedOrigins,
  aiProvider: parsed.AI_PROVIDER,
  aiModel: parsed.AI_MODEL,
  aiProviderBaseUrl: parsed.AI_PROVIDER_BASE_URL.replace(/\/$/, ''),
  aiProviderApiKey: parsed.AI_PROVIDER_API_KEY?.trim() ?? '',
  aiProviderTimeoutMs: parsed.AI_PROVIDER_TIMEOUT_MS,
  aiSystemPrompt: parsed.AI_SYSTEM_PROMPT?.trim() || DEFAULT_SYSTEM_PROMPT,
  guestTokenExpirySeconds: parsed.AI_GUEST_TOKEN_EXPIRY_SECONDS,
  guestRateLimitMax: parsed.AI_GUEST_RATE_LIMIT_MAX,
  guestRateLimitWindowMs: parsed.AI_GUEST_RATE_LIMIT_WINDOW_MS,
  webononeApiBaseUrl: parsed.WEBONONE_API_BASE_URL?.trim() ?? '',
  webononeServiceApiKey: parsed.WEBONONE_SERVICE_API_KEY?.trim() ?? '',
  dataApiBaseUrl: parsed.DATA_API_BASE_URL?.trim() ?? '',
  dataServiceApiKey: parsed.DATA_SERVICE_API_KEY?.trim() ?? '',
  aiCapabilityRefreshMs: parsed.AI_CAPABILITY_REFRESH_MS,
  aiToolHttpTimeoutMs: parsed.AI_TOOL_HTTP_TIMEOUT_MS,
}
