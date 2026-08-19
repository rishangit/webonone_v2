export type Conversation = {
  id: string
  companyId: string | null
  userId: string | null
  guestId: string | null
  title: string | null
  createdAt: string
  updatedAt: string
}

export type RelatedConfirmNode = {
  path: string
  displayKey: string
  exists: boolean
  selected: boolean
  record: Record<string, unknown>
  children?: RelatedConfirmNode[]
}

export type PendingToolCall = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  displayArguments?: Record<string, unknown>
  relatedTree?: RelatedConfirmNode[]
  status: 'pending_confirmation' | 'confirmed' | 'rejected'
}

export type PendingTool = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  displayArguments?: Record<string, unknown>
  status: 'pending_confirmation' | 'confirmed' | 'rejected'
  calls?: PendingToolCall[]
}

export type ChatMessage = {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool' | 'tool_result'
  content: string
  createdAt: string
  pendingTool?: PendingTool | null
  resultRecords?: Record<string, unknown>[]
}

export type PaginatedConversations = {
  items: Conversation[]
  total: number
  page: number
  pageSize: number
}
