import { aiFetch } from '@/features/ai/utils/aiClient'
import type { UserAiSettingsFormValues } from '@/features/settings/schemas/aiSettingsSchemas'

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
  getMine() {
    return aiFetch<AiSettingsResponse>('/me/ai-settings')
  },

  patchMine(body: UserAiSettingsFormValues & { apiKey?: string }) {
    return aiFetch<AiSettingsResponse>('/me/ai-settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
