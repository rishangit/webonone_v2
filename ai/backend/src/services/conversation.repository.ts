import type { Knex } from 'knex'
import type { ConversationOwner } from '../ai/requestContext.js'
import type { AiConversationRow, AiMessageRow, MessageRole } from '../models/db.js'

export type ConversationRepository = {
  insertConversation(row: AiConversationRow): Promise<AiConversationRow>
  findOwned(id: string, owner: ConversationOwner): Promise<AiConversationRow | undefined>
  listOwned(
    owner: ConversationOwner,
    page: number,
    pageSize: number,
  ): Promise<{ items: AiConversationRow[]; total: number }>
  updateTitle(id: string, title: string, updatedAt: Date): Promise<void>
  insertMessage(row: AiMessageRow): Promise<AiMessageRow>
  listMessages(conversationId: string): Promise<AiMessageRow[]>
  listMessagesByToolCallId(conversationId: string, toolCallId: string): Promise<AiMessageRow[]>
  updateMessageToolPayload(
    id: string,
    payload: Record<string, unknown>,
    content?: string,
  ): Promise<void>
}

function applyOwner(query: Knex.QueryBuilder, owner: ConversationOwner) {
  if (owner.guestId) {
    return query.where({ guest_id: owner.guestId }).whereNull('user_id').whereNull('company_id')
  }
  return query
    .where({ user_id: owner.userId })
    .whereNull('guest_id')
    .whereRaw('company_id <=> ?', [owner.companyId])
}

export function createKnexConversationRepository(db: Knex): ConversationRepository {
  return {
    async insertConversation(row) {
      await db('ai_conversations').insert(row)
      return row
    },

    async findOwned(id, owner) {
      const query = db('ai_conversations').where({ id })
      return applyOwner(query, owner).first()
    },

    async listOwned(owner, page, pageSize) {
      const offset = (page - 1) * pageSize
      const countQuery = applyOwner(db('ai_conversations'), owner)
      const listQuery = applyOwner(db('ai_conversations'), owner)
      const [{ total }] = await countQuery.count<{ total: number }[]>({ total: '*' })
      const items = await listQuery.orderBy('updated_at', 'desc').limit(pageSize).offset(offset)
      return { items, total: Number(total) }
    },

    async updateTitle(id, title, updatedAt) {
      await db('ai_conversations').where({ id }).update({ title, updated_at: updatedAt })
    },

    async insertMessage(row) {
      await db('ai_messages').insert({
        ...row,
        tool_payload: row.tool_payload == null ? null : JSON.stringify(row.tool_payload),
      })
      return row
    },

    async listMessages(conversationId) {
      return db('ai_messages').where({ conversation_id: conversationId }).orderBy('created_at', 'asc')
    },

    async listMessagesByToolCallId(conversationId, toolCallId) {
      return db('ai_messages')
        .where({ conversation_id: conversationId, tool_call_id: toolCallId })
        .orderBy('created_at', 'asc')
    },

    async updateMessageToolPayload(id, payload, content) {
      const patch: Record<string, unknown> = { tool_payload: JSON.stringify(payload) }
      if (content !== undefined) {
        patch.content = content
      }
      await db('ai_messages').where({ id }).update(patch)
    },
  }
}

export function createMemoryConversationRepository(): ConversationRepository {
  const conversations: AiConversationRow[] = []
  const messages: AiMessageRow[] = []

  function matchesOwner(row: AiConversationRow, owner: ConversationOwner) {
    if (owner.guestId) {
      return row.guest_id === owner.guestId && row.user_id == null && row.company_id == null
    }
    return row.user_id === owner.userId && row.guest_id == null && row.company_id === owner.companyId
  }

  return {
    async insertConversation(row) {
      conversations.push(row)
      return row
    },
    async findOwned(id, owner) {
      return conversations.find((row) => row.id === id && matchesOwner(row, owner))
    },
    async listOwned(owner, page, pageSize) {
      const items = conversations
        .filter((row) => matchesOwner(row, owner))
        .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
      const total = items.length
      const offset = (page - 1) * pageSize
      return { items: items.slice(offset, offset + pageSize), total }
    },
    async updateTitle(id, title, updatedAt) {
      const row = conversations.find((item) => item.id === id)
      if (row) {
        row.title = title
        row.updated_at = updatedAt
      }
    },
    async insertMessage(row) {
      messages.push(row)
      const conversation = conversations.find((item) => item.id === row.conversation_id)
      if (conversation) {
        conversation.updated_at = row.created_at
      }
      return row
    },
    async listMessages(conversationId) {
      return messages
        .filter((row) => row.conversation_id === conversationId)
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
    },
    async listMessagesByToolCallId(conversationId, toolCallId) {
      return messages
        .filter((row) => row.conversation_id === conversationId && row.tool_call_id === toolCallId)
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
    },
    async updateMessageToolPayload(id, payload, content) {
      const row = messages.find((item) => item.id === id)
      if (row) {
        row.tool_payload = payload
        if (content !== undefined) {
          row.content = content
        }
      }
    },
  }
}

export type { MessageRole }
