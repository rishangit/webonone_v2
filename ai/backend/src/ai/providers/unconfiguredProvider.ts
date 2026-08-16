import { HttpError } from '../../services/httpError.js'
import type { AiProvider, AiProviderId, ChatCompletionInput, ChatCompletionResult } from './types.js'

export class UnconfiguredProvider implements AiProvider {
  constructor(readonly id: AiProviderId) {}

  async complete(_input: ChatCompletionInput): Promise<ChatCompletionResult> {
    throw new HttpError(501, 'AI provider is not configured', 'PROVIDER_NOT_CONFIGURED')
  }
}
