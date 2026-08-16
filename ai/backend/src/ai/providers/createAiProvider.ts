import { env } from '../../config/env.js'
import { OllamaProvider } from './ollamaProvider.js'
import type { AiProvider } from './types.js'
import { UnconfiguredProvider } from './unconfiguredProvider.js'

export function createAiProvider(config = env): AiProvider {
  if (config.aiProvider === 'ollama') {
    return new OllamaProvider({
      baseUrl: config.aiProviderBaseUrl,
      model: config.aiModel,
      timeoutMs: config.aiProviderTimeoutMs,
    })
  }

  return new UnconfiguredProvider(config.aiProvider)
}
