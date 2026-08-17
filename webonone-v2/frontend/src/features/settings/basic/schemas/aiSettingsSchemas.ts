import { z } from 'zod'

const providerEnum = z.enum(['ollama', 'openai', 'gemini', 'anthropic'])

const baseUrlSchema = z
  .string()
  .trim()
  .min(1, 'Base URL is required')
  .max(512)
  .transform((value) => value.replace(/\/$/, ''))

function ollamaCloudBaseUrl(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).hostname === 'ollama.com'
  } catch {
    return false
  }
}

export function isValidOllamaCloudApiKey(apiKey: string): boolean {
  return /^[0-9a-f]{32}\.[A-Za-z0-9_-]+$/.test(apiKey.trim())
}

const SAVED_KEY_MASK = '••••'

export function formatSavedApiKeyHint(hint: string | null | undefined): string {
  const prefix = hint?.trim()
  if (!prefix) return ''
  return `${prefix}.${SAVED_KEY_MASK}`
}

export function isUnchangedSavedApiKey(
  value: string,
  saved?: { apiKey?: string | null; apiKeyHint?: string | null } | null,
): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  const savedKey = saved?.apiKey?.trim()
  if (savedKey && trimmed === savedKey) return true
  const prefix = saved?.apiKeyHint?.trim()
  if (!prefix) return false
  if (trimmed === prefix) return true
  if (trimmed === `${prefix}.${SAVED_KEY_MASK}`) return true
  if (trimmed === `${prefix}${SAVED_KEY_MASK}`) return true
  return false
}

function validateOllamaCloudApiKey(
  data: { provider: z.infer<typeof providerEnum>; baseUrl: string; apiKey?: string },
  ctx: z.RefinementCtx,
) {
  if (data.provider !== 'ollama' || !ollamaCloudBaseUrl(data.baseUrl)) {
    return
  }
  const apiKey = data.apiKey?.trim()
  if (!apiKey) {
    return
  }
  if (!isValidOllamaCloudApiKey(apiKey)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['apiKey'],
      message: 'Paste the full Ollama Cloud API key (it includes a dot).',
    })
  }
}

const userAiSettingsBaseSchema = z.object({
  provider: providerEnum.default('ollama'),
  model: z.string().trim().min(1, 'Model is required').max(128),
  baseUrl: baseUrlSchema,
  apiKey: z.string().optional(),
  timeoutMs: z.coerce.number().int().min(1_000).max(600_000).default(180_000),
})

export const userAiSettingsFormSchema = userAiSettingsBaseSchema.superRefine(validateOllamaCloudApiKey)

export const platformAiSettingsFormSchema = userAiSettingsBaseSchema
  .extend({
    extraSystemPrompt: z.string().max(4000).optional(),
  })
  .superRefine(validateOllamaCloudApiKey)

export type UserAiSettingsFormValues = z.infer<typeof userAiSettingsFormSchema>
export type PlatformAiSettingsFormValues = z.infer<typeof platformAiSettingsFormSchema>

export const OLLAMA_CLOUD_DEFAULTS: UserAiSettingsFormValues = {
  provider: 'ollama',
  model: 'gpt-oss:120b',
  baseUrl: 'https://ollama.com',
  timeoutMs: 180_000,
}
