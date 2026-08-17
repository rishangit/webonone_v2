import { env } from '../../config/env.js'
import { OllamaProvider } from './ollamaProvider.js'
import type { AiProviderConfig } from './providerConfig.js'
import type { AiProvider } from './types.js'
import { UnconfiguredProvider } from './unconfiguredProvider.js'

export function createAiProvider(config: AiProviderConfig): AiProvider {
  if (config.aiProvider === 'ollama') {
    return new OllamaProvider({
      baseUrl: config.aiProviderBaseUrl,
      model: config.aiModel,
      timeoutMs: config.aiProviderTimeoutMs,
      apiKey: config.aiProviderApiKey,
    })
  }

  return new UnconfiguredProvider(config.aiProvider)
}

export function envProviderConfig(): AiProviderConfig {
  return {
    aiProvider: env.aiProvider,
    aiModel: env.aiModel,
    aiProviderBaseUrl: env.aiProviderBaseUrl,
    aiProviderApiKey: env.aiProviderApiKey,
    aiProviderTimeoutMs: env.aiProviderTimeoutMs,
  }
}

export function createAiProviderFromEnv(): AiProvider {
  return createAiProvider(envProviderConfig())
}
