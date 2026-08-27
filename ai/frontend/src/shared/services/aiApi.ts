import { apiClient } from '@/shared/services/apiClient'
import type { ChatMessage, ConfirmItemDecision, Conversation, PaginatedConversations } from '@/shared/types/ai.types'
import type { CatalogListQuery, PaginatedResult } from '@webonone/store-kit'

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

export const aiApi = {
  listConversations: (query: CatalogListQuery): Promise<PaginatedResult<Conversation>> =>
    apiClient<PaginatedConversations>(
      `/conversations?page=${query.page ?? 1}&pageSize=${query.pageSize ?? 12}`,
    ),
  getConversation: async (id: string): Promise<Conversation> => {
    const data = await apiClient<{ conversation: Conversation }>(`/conversations/${id}`)
    return data.conversation
  },
  createConversation: async (body: Record<string, unknown> = {}): Promise<Conversation> => {
    const data = await apiClient<{ conversation: Conversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.conversation
  },
  listMessages: async (id: string): Promise<ChatMessage[]> => {
    const data = await apiClient<{ items: ChatMessage[] }>(`/conversations/${id}/messages`)
    return data.items
  },
  sendMessage: (id: string, content: string) =>
    apiClient<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(
      `/conversations/${id}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
    ),
  confirmToolCall: (conversationId: string, toolCallId: string, decision?: ConfirmItemDecision) =>
    apiClient<{ assistantMessage: ChatMessage }>(
      `/conversations/${conversationId}/tool-calls/${encodeURIComponent(toolCallId)}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({
          relatedSelections: decision?.relatedSelections ?? {},
          argumentOverrides: decision?.argumentOverrides,
          relatedArgumentOverrides: decision?.relatedArgumentOverrides,
        }),
      },
    ),
  rejectToolCall: (conversationId: string, toolCallId: string, remaining = false) =>
    apiClient<{ assistantMessage: ChatMessage }>(
      `/conversations/${conversationId}/tool-calls/${encodeURIComponent(toolCallId)}/reject`,
      { method: 'POST', body: JSON.stringify({ remaining }) },
    ),
  getAiSettings: () => apiClient<AiSettingsResponse>('/me/ai-settings'),
}
