import { nanoid } from 'nanoid'
import { HttpError } from '../../services/httpError.js'
import type { ToolCall } from '../tools/registry.js'
import type { AiProvider, ChatCompletionInput, ChatCompletionResult, ChatMessage } from './types.js'

type OpenAiToolCall = {
  id?: string
  type?: string
  function?: { name?: string; arguments?: string }
}

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
      tool_calls?: OpenAiToolCall[]
    }
  }>
  error?: { message?: string }
}

function parseArgs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
  }
  return {}
}

function toOpenAiMessage(message: ChatMessage) {
  if (message.role === 'tool') {
    return {
      role: 'tool',
      content: message.content,
      tool_call_id: message.toolCallId,
    }
  }
  if (message.toolCalls?.length) {
    return {
      role: 'assistant',
      content: message.content || null,
      tool_calls: message.toolCalls.map((call) => ({
        id: call.id,
        type: 'function',
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments ?? {}),
        },
      })),
    }
  }
  return { role: message.role, content: message.content }
}

function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '')
  if (trimmed.endsWith('/v1')) {
    return `${trimmed}/chat/completions`
  }
  return `${trimmed}/v1/chat/completions`
}

export class OpenAiProvider implements AiProvider {
  readonly id = 'openai' as const

  constructor(
    private readonly options: { baseUrl: string; model: string; timeoutMs: number; apiKey: string },
  ) {}

  async complete(input: ChatCompletionInput): Promise<ChatCompletionResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs)
    try {
      const apiKey = this.options.apiKey.trim()
      if (!apiKey) {
        throw new HttpError(502, 'OpenAI API key is required', 'PROVIDER_AUTH_ERROR')
      }

      const body: Record<string, unknown> = {
        model: this.options.model,
        messages: [
          { role: 'system', content: input.systemPrompt },
          ...input.messages.map(toOpenAiMessage),
        ],
      }
      if (input.tools?.length) {
        body.tools = input.tools
      }

      const res = await fetch(chatCompletionsUrl(this.options.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      })

      const data = (await res.json().catch(() => ({}))) as OpenAiChatResponse
      if (!res.ok) {
        const providerMessage =
          typeof data.error?.message === 'string' ? data.error.message : 'http_error'
        console.error('[ai]', 'provider_http_error', this.id, providerMessage)
        if (res.status === 401) {
          throw new HttpError(
            502,
            'OpenAI rejected the API key. Check Basic Settings → AI.',
            'PROVIDER_AUTH_ERROR',
          )
        }
        throw new HttpError(502, 'AI provider unavailable', 'PROVIDER_ERROR')
      }

      const message = data.choices?.[0]?.message
      const toolCalls: ToolCall[] = (message?.tool_calls ?? [])
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

      const content = message?.content?.trim() ?? ''
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
