import { aiFetch } from '@/features/ai/utils/aiClient'
import type {
  PlatformAiSettingsFormValues,
  UserAiSettingsFormValues,
} from '@/features/settings/basic/schemas/aiSettingsSchemas'

export type AiToolOperationKind =
  | 'list'
  | 'get'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage'
  | 'read'

export type AiSupportedArea = {
  id: string
  service: string
  operations: AiToolOperationKind[]
  requiresCompany: boolean
  toolCount: number
}

export type AiSupportedAreasResponse = {
  areas: AiSupportedArea[]
}

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

  getSupportedAreas(accessToken: string) {
    return aiFetch<AiSupportedAreasResponse>('/me/ai-supported-areas', accessToken)
  },
}
