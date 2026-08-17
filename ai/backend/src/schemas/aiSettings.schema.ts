import { z } from 'zod'
import { isValidOllamaCloudApiKey, ollamaCloudBaseUrl } from '../ai/providers/providerConfig.js'

const providerEnum = z.enum(['ollama', 'openai', 'gemini', 'anthropic'])

const baseUrlSchema = z
  .string()
  .trim()
  .min(1, 'Base URL is required')
  .max(512)
  .transform((value) => value.replace(/\/$/, ''))

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
      message:
        'Paste the full Ollama Cloud API key from ollama.com/settings/keys (it includes a dot, for example 15d6dfe0…751e.AbCdEf…).',
    })
  }
}

const patchAiSettingsBaseSchema = z.object({
  provider: providerEnum.default('ollama'),
  model: z.string().trim().min(1, 'Model is required').max(128),
  baseUrl: baseUrlSchema,
  apiKey: z.string().optional(),
  timeoutMs: z.coerce.number().int().min(1_000).max(600_000).default(180_000),
})

export const patchUserAiSettingsSchema = patchAiSettingsBaseSchema.superRefine(validateOllamaCloudApiKey)

export const patchPlatformAiSettingsSchema = patchAiSettingsBaseSchema
  .extend({
    extraSystemPrompt: z.string().max(4000).optional(),
  })
  .superRefine(validateOllamaCloudApiKey)

export type PatchUserAiSettingsBody = z.infer<typeof patchUserAiSettingsSchema>
export type PatchPlatformAiSettingsBody = z.infer<typeof patchPlatformAiSettingsSchema>
