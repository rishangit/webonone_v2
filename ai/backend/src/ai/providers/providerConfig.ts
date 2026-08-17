import type { AiProviderId } from './types.js'

export type AiProviderConfig = {
  aiProvider: AiProviderId
  aiModel: string
  aiProviderBaseUrl: string
  aiProviderApiKey: string
  aiProviderTimeoutMs: number
}

export function ollamaCloudBaseUrl(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl)
    return url.hostname === 'ollama.com'
  } catch {
    return false
  }
}

/** Ollama Cloud keys from ollama.com/settings/keys look like `{32 hex}.{secret}`. */
export function isValidOllamaCloudApiKey(apiKey: string): boolean {
  return /^[0-9a-f]{32}\.[A-Za-z0-9_-]+$/.test(apiKey.trim())
}

/** Public prefix only — never the secret after `.`. Used to show that a key is already saved. */
export function apiKeyHintFromSecret(apiKey: string): string | null {
  const trimmed = apiKey.trim()
  if (!trimmed) return null
  const dot = trimmed.indexOf('.')
  if (dot > 0) return trimmed.slice(0, dot)
  return trimmed.slice(0, Math.min(8, trimmed.length))
}

export function isProviderConfigComplete(config: AiProviderConfig): boolean {
  if (!config.aiProvider || !config.aiModel.trim() || !config.aiProviderBaseUrl.trim()) {
    return false
  }
  if (config.aiProvider === 'ollama' && ollamaCloudBaseUrl(config.aiProviderBaseUrl)) {
    const apiKey = config.aiProviderApiKey.trim()
    return Boolean(apiKey) && isValidOllamaCloudApiKey(apiKey)
  }
  return true
}
