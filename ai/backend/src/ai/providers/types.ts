import type { ToolCall } from '../tools/registry.js'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCallId?: string
  toolName?: string
  toolCalls?: ToolCall[]
}

export type ProviderTool = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export type ChatCompletionInput = {
  systemPrompt: string
  messages: ChatMessage[]
  tools?: ProviderTool[]
}

export type ChatCompletionResult = {
  content: string
  toolCalls?: ToolCall[]
}

export type AiProviderId = 'ollama' | 'openai' | 'gemini' | 'anthropic'

export interface AiProvider {
  readonly id: AiProviderId
  complete(input: ChatCompletionInput): Promise<ChatCompletionResult>
}
