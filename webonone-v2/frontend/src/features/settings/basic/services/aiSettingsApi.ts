import { aiFetch } from '@/features/ai/utils/aiClient'
import type {
  PlatformAiSettingsFormValues,
  UserAiSettingsFormValues,
} from '@/features/settings/basic/schemas/aiSettingsSchemas'

export type AiSettingsResponse = {
  configured: boolean
  provider: 'ollama' | 'openai' | 'gemini' | 'anthropic'
  model: string
  baseUrl: string
  timeoutMs: number
  hasApiKey: boolean
  apiKeyHint: string | null
  apiKey: string | null
  extraSystemPrompt?: string | null
}

export const aiSettingsApi = {
  getMine(accessToken: string) {
    return aiFetch<AiSettingsResponse>('/me/ai-settings', accessToken)
  },

  patchMine(accessToken: string, body: UserAiSettingsFormValues) {
    return aiFetch<AiSettingsResponse>('/me/ai-settings', accessToken, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  getPlatform(accessToken: string) {
    return aiFetch<AiSettingsResponse>('/admin/ai-settings', accessToken)
  },

  patchPlatform(accessToken: string, body: PlatformAiSettingsFormValues) {
    return aiFetch<AiSettingsResponse>('/admin/ai-settings', accessToken, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
