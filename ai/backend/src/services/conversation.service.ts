import { nanoid } from 'nanoid'
import type { AiRequestContext } from '../ai/requestContext.js'
import { ownerFromContext } from '../ai/requestContext.js'
import type { AiProvider, ChatMessage, ProviderTool } from '../ai/providers/types.js'
import { filterToolsForContext } from '../ai/tools/filterTools.js'
import type { ToolCall, ToolDefinition, ToolExecutor, ToolRegistry } from '../ai/tools/registry.js'
import { recordsFromUnknown } from '../ai/tools/formatRecord.js'
import { partitionUniquePendingWrites, type PendingWrite } from '../ai/tools/uniqueValues.js'
import type { AiConversationRow, AiMessageRow, MessageRole } from '../models/db.js'
import { HttpError } from './httpError.js'
import type { ConversationRepository } from './conversation.repository.js'

const MAX_TOOL_ROUNDS = 6

export type PendingCallStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

export type PendingToolCall = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  status: PendingCallStatus
}

export type PendingTool = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  status: PendingCallStatus
  calls?: PendingToolCall[]
}

export type ConversationDto = {
  id: string
  companyId: string | null
  userId: string | null
  guestId: string | null
  title: string | null
  createdAt: string
  updatedAt: string
}

export type MessageDto = {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  createdAt: string
  pendingTool?: PendingTool | null
  resultRecords?: Record<string, unknown>[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parsePayload(raw: AiMessageRow['tool_payload']): Record<string, unknown> | null {
  if (raw == null) {
    return null
  }
  if (typeof raw === 'object') {
    return raw as Record<string, unknown>
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

function callStatus(value: unknown): PendingCallStatus {
  if (value === 'confirmed' || value === 'rejected' || value === 'pending_confirmation') {
    return value
  }
  return 'pending_confirmation'
}

function storedCallsFromPayload(payload: Record<string, unknown> | null, pending: PendingTool): PendingToolCall[] {
  const raw = payload?.calls
  if (Array.isArray(raw)) {
    const items: PendingToolCall[] = []
    for (const entry of raw) {
      if (!isRecord(entry) || typeof entry.toolCallId !== 'string' || typeof entry.name !== 'string') {
        continue
      }
      items.push({
        toolCallId: entry.toolCallId,
        name: entry.name,
        riskLevel: typeof entry.riskLevel === 'string' ? entry.riskLevel : pending.riskLevel,
        summary: typeof entry.summary === 'string' ? entry.summary : entry.name,
        arguments: isRecord(entry.arguments) ? entry.arguments : {},
        status: callStatus(entry.status),
      })
    }
    if (items.length > 0) {
      return items
    }
  }
  return [
    {
      toolCallId: pending.toolCallId,
      name: pending.name,
      riskLevel: pending.riskLevel,
      summary: pending.summary,
      arguments: pending.arguments,
      status: pending.status,
    },
  ]
}

function remainingPendingCalls(calls: PendingToolCall[]): PendingToolCall[] {
  return calls.filter((call) => call.status === 'pending_confirmation')
}

function pendingFromPayload(row: AiMessageRow): PendingTool | null {
  const payload = parsePayload(row.tool_payload)
  if (
    !payload ||
    (payload.status !== 'pending_confirmation' &&
      payload.status !== 'confirmed' &&
      payload.status !== 'rejected')
  ) {
    return null
  }
  if (typeof payload.name !== 'string' || typeof payload.toolCallId !== 'string') {
    return null
  }
  const pending: PendingTool = {
    toolCallId: payload.toolCallId,
    name: payload.name,
    riskLevel: typeof payload.riskLevel === 'string' ? payload.riskLevel : 'write',
    summary: typeof payload.summary === 'string' ? payload.summary : payload.name,
    arguments: isRecord(payload.arguments) ? payload.arguments : {},
    status: payload.status,
  }
  const calls = storedCallsFromPayload(payload, pending)
  const remaining = remainingPendingCalls(calls)
  return {
    ...pending,
    status: remaining.length > 0 ? 'pending_confirmation' : pending.status,
    calls,
    summary: remaining.map((call) => call.summary).join('\n') || pending.summary,
    arguments: remaining[0]?.arguments ?? pending.arguments,
    name: remaining[0]?.name ?? pending.name,
  }
}

function toConversationDto(row: AiConversationRow): ConversationDto {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    guestId: row.guest_id,
    title: row.title,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function toMessageDto(row: AiMessageRow, resultRecords?: Record<string, unknown>[]): MessageDto {
  const pendingTool = row.role === 'assistant' ? pendingFromPayload(row) : null
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: new Date(row.created_at).toISOString(),
    pendingTool,
    resultRecords:
      row.role === 'assistant' && !pendingTool && resultRecords && resultRecords.length > 0
        ? resultRecords
        : undefined,
  }
}

function collectResultRecords(rows: AiMessageRow[]): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = []
  for (const row of rows) {
    if (row.role !== 'tool_result') {
      continue
    }
    const payload = parsePayload(row.tool_payload)
    records.push(...recordsFromUnknown(payload ?? parsePayload(row.content)))
  }
  return records
}

function messagesToDtos(rows: AiMessageRow[]): MessageDto[] {
  const items: MessageDto[] = []
  let batch: AiMessageRow[] = []
  for (const row of rows) {
    if (row.role === 'tool' || row.role === 'tool_result') {
      batch.push(row)
      continue
    }
    if (row.role === 'user' || row.role === 'assistant') {
      items.push(toMessageDto(row, collectResultRecords(batch)))
      batch = []
      continue
    }
  }
  return items
}

function titleFromContent(content: string) {
  const compact = content.replace(/\s+/g, ' ').trim()
  return compact.length > 80 ? `${compact.slice(0, 77)}...` : compact
}

function toProviderTools(tools: ToolDefinition[]): ProviderTool[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.jsonSchema,
    },
  }))
}

export function withAvailableToolsPrompt(base: string, tools: ToolDefinition[]): string {
  if (tools.length === 0) {
    return base
  }
  return `${base} Tools available in this request: ${tools.map((tool) => tool.name).join(', ')}. When the user asks to suggest, recommend, or list names (for example 10 tags), reply with a numbered list of complete suggestions and wait — do not call create_* until they ask to add or create those items. When they ask to create several named items, call the matching create_* tool once per item in the same turn. When creating, include every required schema property in the tool arguments. Copy name from the user message. Fill remaining descriptive properties (especially description, and color or symbol when present) with a complete suggested value. Do not invent IDs or emails. Names are not ids. Do not call a write tool until entity, action, and target are known; if any is missing, ask a short numbered list of options and wait.`
}

function historyToProviderMessages(rows: AiMessageRow[]): ChatMessage[] {
  const messages: ChatMessage[] = []
  for (const row of rows) {
    if (row.role === 'user') {
      messages.push({ role: 'user', content: row.content })
      continue
    }
    if (row.role === 'assistant') {
      messages.push({ role: 'assistant', content: row.content })
      continue
    }
    if (row.role === 'tool') {
      const payload = parsePayload(row.tool_payload)
      messages.push({
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            id: row.tool_call_id ?? '',
            name: row.tool_name ?? '',
            arguments: isRecord(payload?.arguments) ? payload.arguments : {},
          },
        ],
      })
      continue
    }
    if (row.role === 'tool_result') {
      const payload = parsePayload(row.tool_payload)
      messages.push({
        role: 'tool',
        content: row.content || JSON.stringify(payload ?? {}),
        toolName: row.tool_name ?? undefined,
        toolCallId: row.tool_call_id ?? undefined,
      })
    }
  }
  return messages
}

function isPendingOutput(output: unknown): output is {
  status: 'pending_confirmation'
  name: string
  riskLevel: string
  arguments: Record<string, unknown>
  summary: string
} {
  return isRecord(output) && output.status === 'pending_confirmation' && typeof output.name === 'string'
}

type PendingCallItem = PendingToolCall

function pendingCallItems(assistant: AiMessageRow, pending: PendingTool): PendingCallItem[] {
  return storedCallsFromPayload(parsePayload(assistant.tool_payload), pending)
}

function payloadHasToolCallId(row: AiMessageRow, toolCallId: string): boolean {
  if (row.tool_call_id === toolCallId) {
    return true
  }
  const payload = parsePayload(row.tool_payload)
  if (!payload) {
    return false
  }
  if (payload.toolCallId === toolCallId) {
    return true
  }
  if (!Array.isArray(payload.calls)) {
    return false
  }
  return payload.calls.some((entry) => isRecord(entry) && entry.toolCallId === toolCallId)
}

export type ConversationService = ReturnType<typeof createConversationService>

export function createConversationService(deps: {
  repository: ConversationRepository
  provider: AiProvider
  systemPrompt: string
  registry?: ToolRegistry
  executor?: ToolExecutor
  now?: () => Date
}) {
  const now = deps.now ?? (() => new Date())

  const getOwnedOrThrow = async (id: string, ctx: AiRequestContext) => {
    const conversation = await deps.repository.findOwned(id, ownerFromContext(ctx))
    if (!conversation) {
      throw new HttpError(404, 'Conversation not found', 'NOT_FOUND')
    }
    return conversation
  }

  const insertRow = async (partial: Omit<AiMessageRow, 'id' | 'created_at'> & { createdAt?: Date }) => {
    const row: AiMessageRow = {
      id: nanoid(),
      conversation_id: partial.conversation_id,
      company_id: partial.company_id,
      role: partial.role,
      content: partial.content,
      tool_name: partial.tool_name,
      tool_call_id: partial.tool_call_id,
      tool_payload: partial.tool_payload,
      created_at: partial.createdAt ?? now(),
    }
    await deps.repository.insertMessage(row)
    return row
  }

  const dtoFor = async (row: AiMessageRow): Promise<MessageDto> => {
    const rows = await deps.repository.listMessages(row.conversation_id)
    return messagesToDtos(rows).find((item) => item.id === row.id) ?? toMessageDto(row)
  }

  const runProviderLoop = async (
    ctx: AiRequestContext,
    conversation: AiConversationRow,
  ): Promise<AiMessageRow> => {
    const tools = filterToolsForContext(deps.registry?.list() ?? [], ctx)
    const providerTools = toProviderTools(tools)
    const systemPrompt = withAvailableToolsPrompt(deps.systemPrompt, tools)

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const history = await deps.repository.listMessages(conversation.id)
      const completion = await deps.provider.complete({
        systemPrompt,
        messages: historyToProviderMessages(history),
        tools: providerTools.length ? providerTools : undefined,
      })

      if (!completion.toolCalls?.length) {
        return insertRow({
          conversation_id: conversation.id,
          company_id: conversation.company_id,
          role: 'assistant',
          content: completion.content || 'Done.',
          tool_name: null,
          tool_call_id: null,
          tool_payload: null,
        })
      }

      const pendingWrites: PendingWrite[] = []
      for (const call of completion.toolCalls) {
        await insertRow({
          conversation_id: conversation.id,
          company_id: conversation.company_id,
          role: 'tool',
          content: '',
          tool_name: call.name,
          tool_call_id: call.id,
          tool_payload: { arguments: call.arguments },
        })

        const result = deps.executor
          ? await deps.executor.execute(call, ctx)
          : { toolCallId: call.id, name: call.name, ok: false, output: { code: 'TOOLS_NOT_ENABLED' } }

        await insertRow({
          conversation_id: conversation.id,
          company_id: conversation.company_id,
          role: 'tool_result',
          content: JSON.stringify(result.output ?? {}),
          tool_name: call.name,
          tool_call_id: call.id,
          tool_payload: result.output && isRecord(result.output) ? result.output : { output: result.output },
        })

        if (isPendingOutput(result.output)) {
          pendingWrites.push({ call, output: result.output })
        }
      }

      const existingNamesByTool = new Map<string, Set<string>>()
      if (deps.executor?.lookupExistingUniqueValues && deps.registry && pendingWrites.length > 0) {
        const valuesByTool = new Map<string, { tool: ToolDefinition; values: string[] }>()
        for (const write of pendingWrites) {
          const tool = deps.registry.get(write.call.name)
          const uniqueBy = tool?.argCompletion?.uniqueBy
          if (!tool || !uniqueBy || !tool.argCompletion?.uniqueLookup) {
            continue
          }
          const value = write.output.arguments[uniqueBy]
          if (typeof value !== 'string' || !value.trim()) {
            continue
          }
          const group = valuesByTool.get(tool.name) ?? { tool, values: [] }
          group.values.push(value.trim())
          valuesByTool.set(tool.name, group)
        }
        for (const [toolName, group] of valuesByTool) {
          try {
            const existing = await deps.executor.lookupExistingUniqueValues(group.tool, ctx, group.values)
            existingNamesByTool.set(
              toolName,
              new Set(existing.map((name) => name.trim().toLowerCase()).filter(Boolean)),
            )
          } catch {
            existingNamesByTool.set(toolName, new Set())
          }
        }
      }

      const partitioned = partitionUniquePendingWrites(
        pendingWrites,
        (name) => deps.registry?.get(name),
        existingNamesByTool,
      )
      const skippedIds = new Set(
        pendingWrites
          .filter((write) => !partitioned.keep.some((kept) => kept.call.id === write.call.id))
          .map((write) => write.call.id),
      )
      for (const callId of skippedIds) {
        const related = await deps.repository.listMessagesByToolCallId(conversation.id, callId)
        const resultRow = related.find((row) => row.role === 'tool_result')
        if (resultRow) {
          await deps.repository.updateMessageToolPayload(
            resultRow.id,
            { status: 'skipped_exists' },
            JSON.stringify({ status: 'skipped_exists' }),
          )
        }
      }

      const skippedExisting = [...new Set(partitioned.skippedExisting)]
      const firstWrite = partitioned.keep[0]
      if (firstWrite) {
        const calls = partitioned.keep.map(({ call, output }) => ({
          toolCallId: call.id,
          name: output.name,
          riskLevel: output.riskLevel,
          arguments: output.arguments,
          summary: output.summary,
          status: 'pending_confirmation' as const,
        }))
        const summary = calls.map((item) => item.summary).join('\n')
        const destructive = partitioned.keep.some((item) => item.output.riskLevel === 'destructive')
        const skippedLine =
          skippedExisting.length > 0
            ? `Already in the library (skipped): ${skippedExisting.join(', ')}.`
            : ''
        const confirmLine = `I can ${destructive ? 'delete' : 'change'} this after you confirm each item.`
        return insertRow({
          conversation_id: conversation.id,
          company_id: conversation.company_id,
          role: 'assistant',
          content: [completion.content, skippedLine, confirmLine].filter(Boolean).join('\n') || confirmLine,
          tool_name: firstWrite.call.name,
          tool_call_id: firstWrite.call.id,
          tool_payload: {
            status: 'pending_confirmation',
            toolCallId: firstWrite.call.id,
            name: firstWrite.output.name,
            riskLevel: firstWrite.output.riskLevel,
            arguments: firstWrite.output.arguments,
            summary,
            calls,
          },
        })
      }

      if (skippedExisting.length > 0) {
        return insertRow({
          conversation_id: conversation.id,
          company_id: conversation.company_id,
          role: 'assistant',
          content:
            completion.content ||
            `All of these names are already in the library: ${skippedExisting.join(', ')}.`,
          tool_name: null,
          tool_call_id: null,
          tool_payload: null,
        })
      }
    }

    return insertRow({
      conversation_id: conversation.id,
      company_id: conversation.company_id,
      role: 'assistant',
      content: 'I could not finish the tool steps. Please try again with a simpler request.',
      tool_name: null,
      tool_call_id: null,
      tool_payload: null,
    })
  }

  return {
    async createConversation(ctx: AiRequestContext, title?: string) {
      const createdAt = now()
      const row: AiConversationRow = {
        id: nanoid(),
        company_id: ctx.companyId,
        user_id: ctx.userId,
        guest_id: ctx.guestId,
        title: title ?? null,
        created_at: createdAt,
        updated_at: createdAt,
      }
      await deps.repository.insertConversation(row)
      return toConversationDto(row)
    },

    async listConversations(ctx: AiRequestContext, page = 1, pageSize = 12) {
      const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
      const safePageSize = Math.min(100, Math.max(1, pageSize || 12))
      const result = await deps.repository.listOwned(ownerFromContext(ctx), safePage, safePageSize)
      return {
        items: result.items.map(toConversationDto),
        total: result.total,
        page: safePage,
        pageSize: safePageSize,
      }
    },

    async getConversation(ctx: AiRequestContext, id: string) {
      return toConversationDto(await getOwnedOrThrow(id, ctx))
    },

    async listMessages(ctx: AiRequestContext, id: string) {
      await getOwnedOrThrow(id, ctx)
      const rows = await deps.repository.listMessages(id)
      return { items: messagesToDtos(rows) }
    },

    async sendMessage(ctx: AiRequestContext, conversationId: string, content: string) {
      const conversation = await getOwnedOrThrow(conversationId, ctx)
      const userMessage = await insertRow({
        conversation_id: conversation.id,
        company_id: conversation.company_id,
        role: 'user',
        content,
        tool_name: null,
        tool_call_id: null,
        tool_payload: null,
      })

      if (!conversation.title) {
        await deps.repository.updateTitle(conversation.id, titleFromContent(content), userMessage.created_at)
      }

      try {
        const assistantMessage = await runProviderLoop(
          { ...ctx, conversationId: conversation.id },
          conversation,
        )
        return {
          userMessage: toMessageDto(userMessage),
          assistantMessage: await dtoFor(assistantMessage),
        }
      } catch (err) {
        if (err instanceof HttpError) {
          throw err
        }
        throw new HttpError(502, 'AI provider unavailable', 'PROVIDER_ERROR')
      }
    },

    async confirmToolCall(ctx: AiRequestContext, conversationId: string, toolCallId: string) {
      const conversation = await getOwnedOrThrow(conversationId, ctx)
      const related = await deps.repository.listMessagesByToolCallId(conversation.id, toolCallId)
      let assistant = related.find((row) => row.role === 'assistant') ?? null
      if (!assistant) {
        const all = await deps.repository.listMessages(conversation.id)
        assistant =
          [...all].reverse().find((row) => row.role === 'assistant' && payloadHasToolCallId(row, toolCallId)) ?? null
      }
      const pending = assistant ? pendingFromPayload(assistant) : null
      if (!assistant || !pending) {
        throw new HttpError(404, 'Pending tool call not found', 'NOT_FOUND')
      }
      const stored = pendingCallItems(assistant, pending)
      const target = stored.find((item) => item.toolCallId === toolCallId)
      if (!target) {
        throw new HttpError(404, 'Pending tool call not found', 'NOT_FOUND')
      }
      if (target.status === 'confirmed' || pending.status === 'confirmed') {
        const already = await insertRow({
          conversation_id: conversation.id,
          company_id: conversation.company_id,
          role: 'assistant',
          content: 'This change was already applied.',
          tool_name: null,
          tool_call_id: null,
          tool_payload: null,
        })
        return { assistantMessage: toMessageDto(already) }
      }
      if (target.status !== 'pending_confirmation') {
        throw new HttpError(404, 'Pending tool call not found', 'NOT_FOUND')
      }
      if (!deps.executor) {
        throw new HttpError(503, 'Tools are not enabled', 'TOOLS_NOT_ENABLED')
      }

      const relatedForCall = await deps.repository.listMessagesByToolCallId(conversation.id, target.toolCallId)
      const toolRowForCall = relatedForCall.find((row) => row.role === 'tool')
      const resultRowForCall = relatedForCall.find((row) => row.role === 'tool_result')
      const call: ToolCall = {
        id: target.toolCallId,
        name: toolRowForCall?.tool_name ?? target.name,
        arguments: target.arguments,
      }
      const result = await deps.executor.execute(call, ctx, { confirmed: true })
      const output = result.output && isRecord(result.output) ? result.output : { output: result.output }
      if (resultRowForCall) {
        await deps.repository.updateMessageToolPayload(resultRowForCall.id, output, JSON.stringify(output))
      } else {
        await insertRow({
          conversation_id: conversation.id,
          company_id: conversation.company_id,
          role: 'tool_result',
          content: JSON.stringify(output),
          tool_name: call.name,
          tool_call_id: target.toolCallId,
          tool_payload: output,
        })
      }
      target.status = result.ok ? 'confirmed' : 'rejected'
      const remaining = remainingPendingCalls(stored)
      const anyOk = stored.some((item) => item.status === 'confirmed')
      const nextPayload = {
        ...(parsePayload(assistant.tool_payload) ?? pending),
        status: remaining.length > 0 ? 'pending_confirmation' : anyOk ? 'confirmed' : 'rejected',
        toolCallId: pending.toolCallId,
        name: remaining[0]?.name ?? pending.name,
        riskLevel: remaining[0]?.riskLevel ?? pending.riskLevel,
        arguments: remaining[0]?.arguments ?? pending.arguments,
        summary: remaining.map((item) => item.summary).join('\n') || pending.summary,
        calls: stored,
      }
      await deps.repository.updateMessageToolPayload(assistant.id, nextPayload)
      assistant.tool_payload = nextPayload
      return { assistantMessage: await dtoFor(assistant) }
    },

    async rejectToolCall(
      ctx: AiRequestContext,
      conversationId: string,
      toolCallId: string,
      options?: { remaining?: boolean },
    ) {
      const conversation = await getOwnedOrThrow(conversationId, ctx)
      const related = await deps.repository.listMessagesByToolCallId(conversation.id, toolCallId)
      let assistant = related.find((row) => row.role === 'assistant') ?? null
      if (!assistant) {
        const all = await deps.repository.listMessages(conversation.id)
        assistant =
          [...all].reverse().find((row) => row.role === 'assistant' && payloadHasToolCallId(row, toolCallId)) ?? null
      }
      const pending = assistant ? pendingFromPayload(assistant) : null
      if (!assistant || !pending || pending.status !== 'pending_confirmation') {
        throw new HttpError(404, 'Pending tool call not found', 'NOT_FOUND')
      }
      const stored = pendingCallItems(assistant, pending)
      const rejectIds = new Set<string>()
      if (options?.remaining) {
        for (const item of remainingPendingCalls(stored)) {
          rejectIds.add(item.toolCallId)
        }
      } else {
        const target = stored.find((item) => item.toolCallId === toolCallId)
        if (!target || target.status !== 'pending_confirmation') {
          throw new HttpError(404, 'Pending tool call not found', 'NOT_FOUND')
        }
        rejectIds.add(target.toolCallId)
      }
      for (const item of stored) {
        if (rejectIds.has(item.toolCallId)) {
          item.status = 'rejected'
        }
      }
      for (const id of rejectIds) {
        const relatedForCall = await deps.repository.listMessagesByToolCallId(conversation.id, id)
        const resultRow = relatedForCall.find((row) => row.role === 'tool_result')
        if (resultRow) {
          await deps.repository.updateMessageToolPayload(
            resultRow.id,
            { status: 'rejected' },
            JSON.stringify({ status: 'rejected' }),
          )
        }
      }
      const remaining = remainingPendingCalls(stored)
      const nextPayload = {
        ...(parsePayload(assistant.tool_payload) ?? pending),
        status: remaining.length > 0 ? 'pending_confirmation' : 'rejected',
        toolCallId: pending.toolCallId,
        name: remaining[0]?.name ?? pending.name,
        riskLevel: remaining[0]?.riskLevel ?? pending.riskLevel,
        arguments: remaining[0]?.arguments ?? pending.arguments,
        summary: remaining.map((item) => item.summary).join('\n') || pending.summary,
        calls: stored,
      }
      await deps.repository.updateMessageToolPayload(assistant.id, nextPayload)
      assistant.tool_payload = nextPayload
      return { assistantMessage: await dtoFor(assistant) }
    },
  }
}
