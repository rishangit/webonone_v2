import { nanoid } from 'nanoid'
import { HttpError } from '../../services/httpError.js'
import type { ToolCall } from '../tools/registry.js'
import type { AiProvider, ChatCompletionInput, ChatCompletionResult, ChatMessage } from './types.js'

type OllamaToolCall = {
  id?: string
  function?: { name?: string; arguments?: unknown }
}

type OllamaChatResponse = {
  message?: {
    content?: string
    tool_calls?: OllamaToolCall[]
  }
  error?: string
}

function parseArgs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (typeof parsed === 'string') {
        return parseArgs(parsed)
      }
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
  }
  return {}
}

function toOllamaMessage(message: ChatMessage) {
  if (message.role === 'tool') {
    return {
      role: 'tool',
      content: message.content,
      tool_name: message.toolName,
    }
  }
  if (message.toolCalls?.length) {
    return {
      role: 'assistant',
      content: message.content || '',
      tool_calls: message.toolCalls.map((call) => ({
        id: call.id,
        type: 'function',
        function: { name: call.name, arguments: call.arguments },
      })),
    }
  }
  return { role: message.role, content: message.content }
}

export class OllamaProvider implements AiProvider {
  readonly id = 'ollama' as const

  constructor(
    private readonly options: { baseUrl: string; model: string; timeoutMs: number; apiKey?: string },
  ) {}

  async complete(input: ChatCompletionInput): Promise<ChatCompletionResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs)
    try {
      const body: Record<string, unknown> = {
        model: this.options.model,
        stream: false,
        messages: [
          { role: 'system', content: input.systemPrompt },
          ...input.messages.map(toOllamaMessage),
        ],
      }
      if (input.tools?.length) {
        body.tools = input.tools
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const apiKey = this.options.apiKey?.trim()
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`
      }

      const res = await fetch(`${this.options.baseUrl}/api/chat`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify(body),
      })

      const data = (await res.json().catch(() => ({}))) as OllamaChatResponse
      if (!res.ok) {
        const providerMessage = typeof data.error === 'string' ? data.error : 'http_error'
        console.error('[ai]', 'provider_http_error', this.id, providerMessage)
        if (providerMessage.toLowerCase().includes('not found')) {
          throw new HttpError(502, 'AI model is not available. Check AI_MODEL against the configured Ollama host.', 'PROVIDER_ERROR')
        }
        if (res.status === 401 || providerMessage.toLowerCase().includes('unauthorized')) {
          throw new HttpError(
            502,
            'Ollama Cloud rejected the API key. Paste the full key from ollama.com/settings/keys (it includes a dot) in Basic Settings → AI.',
            'PROVIDER_AUTH_ERROR',
          )
        }
        throw new HttpError(502, 'AI provider unavailable', 'PROVIDER_ERROR')
      }

      const toolCalls: ToolCall[] = (data.message?.tool_calls ?? [])
        .map((call) => {
          const name = call.function?.name?.trim()
          if (!name) {
            return null
          }
          return {
            id: call.id?.trim() || nanoid(),
            name,
            arguments: parseArgs(call.function?.arguments),
          }
        })
        .filter((call): call is ToolCall => Boolean(call))

      const content = data.message?.content?.trim() ?? ''
      if (!content && toolCalls.length === 0) {
        throw new HttpError(502, 'AI provider returned an empty response', 'PROVIDER_ERROR')
      }

      return { content, toolCalls: toolCalls.length ? toolCalls : undefined }
    } catch (err) {
      if (err instanceof HttpError) {
        throw err
      }
      console.error('[ai]', 'provider_failure', this.id)
      throw new HttpError(502, 'AI provider unavailable', 'PROVIDER_ERROR')
    } finally {
      clearTimeout(timer)
    }
  }
}
