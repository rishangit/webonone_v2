import { nanoid } from 'nanoid'
import type { AiRequestContext } from '../ai/requestContext.js'
import { ownerFromContext } from '../ai/requestContext.js'
import type { AiProvider, ChatMessage, ProviderTool } from '../ai/providers/types.js'
import {
  expandCreateCalls,
  listedCreateNames,
  mergeUniqueCreateCalls,
  remainingCreateCallsPrompt,
  remainingItemsTablePrompt,
  requestedItemCount,
  resolveCreateTool,
  uniqueCreateNameCount,
} from '../ai/tools/extractCreateItems.js'
import { filterToolsForContext } from '../ai/tools/filterTools.js'
import {
  attachRelatedDisplay,
  argsHaveRelatedHints,
  buildParentDisplayFields,
  buildRelatedTree,
  displayArgumentsFromTree,
  displayCreateArguments,
  parseRelatedTree,
  refreshRelatedTree,
  summaryForDisplay,
} from '../ai/tools/relatedArgs.js'
import { buildConfirmDisplayFields, type ConfirmDisplayField } from '../ai/tools/confirmDisplay.js'
import type { RelatedNode, ToolCall, ToolDefinition, ToolExecutor, ToolRegistry } from '../ai/tools/registry.js'
import { recordsFromUnknown, withRecordOpen } from '../ai/tools/formatRecord.js'
import { partitionUniquePendingWrites, type PendingWrite } from '../ai/tools/uniqueValues.js'
import type { AiConversationRow, AiMessageRow, MessageRole } from '../models/db.js'
import { HttpError } from './httpError.js'
import type { ConversationRepository } from './conversation.repository.js'
import {
  formatEntityContextSupplement,
  getUpdateToolNameForDataEntityKind,
  resolveEntityContext,
} from '../ai/entityContext/resolveEntityContext.js'
import type { DataEntityContextRef, ResolvedEntityContext } from '../ai/entityContext/types.js'
import {
  entityRelatedRetryPrompt,
  expandEntityRelatedCalls,
  hasWriteToolCalls,
  isAttributeUnitIntent,
  isRelatedSuggestionIntent,
} from '../ai/tools/expandEntityRelatedCalls.js'

const MAX_TOOL_ROUNDS = 6

export type PendingCallStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

export type PendingToolCall = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  displayArguments?: Record<string, unknown>
  displayFields?: ConfirmDisplayField[]
  relatedTree?: RelatedNode[]
  status: PendingCallStatus
}

export type PendingTool = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  displayArguments?: Record<string, unknown>
  displayFields?: ConfirmDisplayField[]
  relatedTree?: RelatedNode[]
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
  context?: DataEntityContextRef[]
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

function parseDisplayFields(raw: unknown): ConfirmDisplayField[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined
  }
  const fields = raw.filter(
    (field): field is ConfirmDisplayField =>
      isRecord(field) &&
      typeof field.key === 'string' &&
      typeof field.label === 'string' &&
      typeof field.value === 'string' &&
      typeof field.missing === 'boolean' &&
      typeof field.editable === 'boolean' &&
      (field.inputType === 'text' || field.inputType === 'number'),
  )
  return fields.length > 0 ? fields : undefined
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
        displayArguments: isRecord(entry.displayArguments) ? entry.displayArguments : undefined,
        displayFields: parseDisplayFields(entry.displayFields),
        relatedTree: parseRelatedTree(entry.relatedTree),
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
      displayArguments: pending.displayArguments,
      displayFields: pending.displayFields,
      relatedTree: pending.relatedTree,
      status: pending.status,
    },
  ]
}

function remainingPendingCalls(calls: PendingToolCall[]): PendingToolCall[] {
  return calls.filter((call) => call.status === 'pending_confirmation')
}

async function refreshPendingCallRelatedTree(
  call: PendingToolCall,
  ctx: AiRequestContext,
  registry: ToolRegistry | undefined,
  executor: ToolExecutor | undefined,
): Promise<PendingToolCall> {
  const tool = registry?.get(call.name)
  if (!tool?.relatedArgs?.length || !executor?.lookupRelatedRecord) {
    return call
  }
  const lookup = (spec: Parameters<NonNullable<ToolExecutor['lookupRelatedRecord']>>[1], query: {
    id?: string
    name?: string
  }) => executor.lookupRelatedRecord!(tool, spec, ctx, query)

  let tree = call.relatedTree ?? []
  if (tree.length === 0 && argsHaveRelatedHints(tool, call.arguments)) {
    tree = await buildRelatedTree(tool, call.arguments, {
      getTool: (name) => registry?.get(name),
      lookup,
      role: ctx.role,
    })
  } else if (tree.length > 0) {
    tree = await refreshRelatedTree(tool, tree, lookup, {
      getTool: (name) => registry?.get(name),
      role: ctx.role,
    })
  }

  const lookupRecordById = async (item: typeof tool, id: string) => {
    const getToolName = item.name.replace(/^update_/, 'get_')
    const getTool = registry?.get(getToolName)
    if (!getTool || !executor) {
      return null
    }
    const result = await executor.execute(
      { id: `lookup:${getToolName}:${id}`, name: getToolName, arguments: { id } },
      ctx,
      { confirmed: true },
    )
    if (!result.ok || !isRecord(result.output)) {
      return null
    }
    const data = result.output.data
    if (isRecord(data)) {
      return data
    }
    if (typeof result.output.id === 'string') {
      return result.output
    }
    return null
  }
  const displayFields = await buildParentDisplayFields(tool, call.arguments, ctx.role, lookupRecordById)
  const displayArguments = displayArgumentsFromTree(call.arguments, tool, tree, ctx.role)
  return {
    ...call,
    relatedTree: tree,
    displayArguments,
    displayFields,
    summary: summaryForDisplay(displayArguments),
  }
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
    displayArguments: isRecord(payload.displayArguments) ? payload.displayArguments : undefined,
    displayFields: parseDisplayFields(payload.displayFields),
    relatedTree: parseRelatedTree(payload.relatedTree),
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

function entityContextFromPayload(row: AiMessageRow): DataEntityContextRef[] | undefined {
  if (row.role !== 'user') {
    return undefined
  }
  const payload = parsePayload(row.tool_payload)
  const raw = payload?.entityContext
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined
  }
  const items: DataEntityContextRef[] = []
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue
    }
    if (
      entry.service === 'data' &&
      typeof entry.kind === 'string' &&
      typeof entry.id === 'string' &&
      entry.id.length === 21
    ) {
      items.push({
        service: 'data',
        kind: entry.kind as DataEntityContextRef['kind'],
        id: entry.id,
        label: typeof entry.label === 'string' ? entry.label : undefined,
      })
    }
  }
  return items.length > 0 ? items : undefined
}

function dedupeEntityContext(refs: DataEntityContextRef[]): DataEntityContextRef[] {
  const seen = new Set<string>()
  const items: DataEntityContextRef[] = []
  for (const ref of refs) {
    const key = `${ref.service}:${ref.kind}:${ref.id}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    items.push(ref)
  }
  return items
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
    context: entityContextFromPayload(row),
  }
}

function collectResultRecords(rows: AiMessageRow[], tools: ToolDefinition[]): Record<string, unknown>[] {
  const argsByCallId = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    if (row.role !== 'tool' || !row.tool_call_id) {
      continue
    }
    const payload = parsePayload(row.tool_payload)
    argsByCallId.set(row.tool_call_id, isRecord(payload?.arguments) ? payload.arguments : {})
  }
  const records: Record<string, unknown>[] = []
  for (const row of rows) {
    if (row.role !== 'tool_result') {
      continue
    }
    const payload = parsePayload(row.tool_payload)
    const extracted = recordsFromUnknown(payload ?? parsePayload(row.content))
    const tool = tools.find((item) => item.name === row.tool_name)
    const args = row.tool_call_id ? (argsByCallId.get(row.tool_call_id) ?? {}) : {}
    records.push(...withRecordOpen(extracted, tool, args))
  }
  return records
}

function messagesToDtos(rows: AiMessageRow[], tools: ToolDefinition[]): MessageDto[] {
  const items: MessageDto[] = []
  let batch: AiMessageRow[] = []
  for (const row of rows) {
    if (row.role === 'tool' || row.role === 'tool_result') {
      batch.push(row)
      continue
    }
    if (row.role === 'user' || row.role === 'assistant') {
      items.push(toMessageDto(row, collectResultRecords(batch, tools)))
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
  return `${base} Tools available in this request: ${tools.map((tool) => tool.name).join(', ')}. When listing create-ready records, fill every jsonSchema property on the matching create_* tool (required and optional) and call that tool once per item in the same turn so the chat UI can show Confirm and Skip. If the user asks for N items (for example 10 tags), make N create_* calls in that turn — one per item — not a single call. Do not ask which items to create in text. When creating, include every schema property in the tool arguments. Copy name from the user message. Suggest remaining fields (description, symbol, is_base, status, color) with complete values. For related records, put the related name (and symbol) instead of an opaque id; list matching records first (list_*). never invent IDs or emails. Do not call a write tool until entity, action, and target are known; if the entity type is unclear, ask a short numbered list of options and wait.`
}

function lastUserContent(rows: AiMessageRow[]): string {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]
    if (row?.role === 'user') {
      return row.content
    }
  }
  return ''
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
  resolveProvider: (ctx: AiRequestContext) => Promise<{ provider: AiProvider; systemPrompt: string }>
  defaultSystemPrompt: string
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

  const listedTools = () => deps.registry?.list() ?? []

  const dtoFor = async (row: AiMessageRow): Promise<MessageDto> => {
    const rows = await deps.repository.listMessages(row.conversation_id)
    return messagesToDtos(rows, listedTools()).find((item) => item.id === row.id) ?? toMessageDto(row)
  }

  const runProviderLoop = async (
    ctx: AiRequestContext,
    conversation: AiConversationRow,
    provider: AiProvider,
    baseSystemPrompt: string,
    entityContextSupplement = '',
    resolvedEntityContext: ResolvedEntityContext[] = [],
  ): Promise<AiMessageRow> => {
    const tools = filterToolsForContext(deps.registry?.list() ?? [], ctx)
    const providerTools = toProviderTools(tools)
    const promptBase = entityContextSupplement
      ? `${baseSystemPrompt}\n\n${entityContextSupplement}`
      : baseSystemPrompt
    const systemPrompt = withAvailableToolsPrompt(promptBase, tools)

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const history = await deps.repository.listMessages(conversation.id)
      const completion = await provider.complete({
        systemPrompt,
        messages: historyToProviderMessages(history),
        tools: providerTools.length ? providerTools : undefined,
      })

      let toolCalls: ToolCall[] = completion.toolCalls ?? []
      let leadContent = completion.content
      const userMessage = lastUserContent(history)
      if (ctx.role !== 'guest' && deps.executor) {
        const before = uniqueCreateNameCount(toolCalls)
        toolCalls = expandCreateCalls({
          content: completion.content,
          tools,
          userMessage,
          role: ctx.role,
          existingCalls: toolCalls,
        })
        if (uniqueCreateNameCount(toolCalls) > before) {
          leadContent = ''
        }
        const requested = requestedItemCount(userMessage)
        const liftFromText = (content: string | undefined) => {
          if (!content) {
            return
          }
          toolCalls = expandCreateCalls({
            content,
            tools,
            userMessage,
            role: ctx.role,
            existingCalls: toolCalls,
          })
        }
        const fillRemainingTable = async (count: number) => {
          const createTool = resolveCreateTool({ tools, existingCalls: toolCalls, userMessage })
          const table = await provider.complete({
            systemPrompt: `${systemPrompt} When the user asks for N items, output a markdown table of exactly those N items including every schema column (required and optional). Do not call tools.`,
            messages: [
              ...historyToProviderMessages(history),
              {
                role: 'assistant',
                content: completion.content || `Prepared ${uniqueCreateNameCount(toolCalls) || 0} item(s).`,
              },
              {
                role: 'user',
                content: remainingItemsTablePrompt(count, listedCreateNames(toolCalls), createTool),
              },
            ],
          })
          liftFromText(table.content)
        }
        if (requested && uniqueCreateNameCount(toolCalls) < requested) {
          await fillRemainingTable(requested)
        }
        if (requested && uniqueCreateNameCount(toolCalls) < requested) {
          const createTool = resolveCreateTool({ tools, existingCalls: toolCalls, userMessage })
          const retryPrompt = remainingCreateCallsPrompt(requested, createTool)
          const retry = await provider.complete({
            systemPrompt: `${systemPrompt} ${retryPrompt}`,
            messages: [
              ...historyToProviderMessages(history),
              {
                role: 'assistant',
                content: completion.content || `Prepared ${uniqueCreateNameCount(toolCalls) || 0} item(s).`,
              },
              {
                role: 'user',
                content: retryPrompt,
              },
            ],
            tools: providerTools.length ? providerTools : undefined,
          })
          if (retry.toolCalls?.length) {
            toolCalls = mergeUniqueCreateCalls(toolCalls, retry.toolCalls)
          }
          liftFromText(retry.content)
        }
        if (requested && uniqueCreateNameCount(toolCalls) < requested) {
          await fillRemainingTable(requested)
        }
        if (requested && uniqueCreateNameCount(toolCalls) > 0) {
          leadContent = ''
        }

        const primaryEntityContext = resolvedEntityContext.find((item) => item.record && !item.error)
        const shouldExpandEntityRelated =
          resolvedEntityContext.length > 0 &&
          !hasWriteToolCalls(toolCalls, tools) &&
          (isRelatedSuggestionIntent(userMessage) ||
            Boolean(
              primaryEntityContext && isAttributeUnitIntent(userMessage, primaryEntityContext.ref.kind),
            ))

        if (shouldExpandEntityRelated) {
          const hadWrites = hasWriteToolCalls(toolCalls, tools)
          toolCalls = expandEntityRelatedCalls({
            content: completion.content,
            tools,
            userMessage,
            resolved: resolvedEntityContext,
            existingCalls: toolCalls,
          })
          if (hasWriteToolCalls(toolCalls, tools) && !hadWrites) {
            leadContent = ''
          }

          if (!hasWriteToolCalls(toolCalls, tools)) {
            const primary = resolvedEntityContext.find((item) => item.record)
            if (primary) {
              const updateToolName = getUpdateToolNameForDataEntityKind(primary.ref.kind)
              const updateTool = tools.find((tool) => tool.name === updateToolName)
              if (updateTool?.relatedArgs?.length) {
                const retryPrompt = entityRelatedRetryPrompt(
                  resolvedEntityContext,
                  updateTool,
                  userMessage,
                )
                const retry = await provider.complete({
                  systemPrompt: `${systemPrompt} ${retryPrompt}`,
                  messages: [
                    ...historyToProviderMessages(history),
                    {
                      role: 'assistant',
                      content: completion.content || 'Prepared suggestions.',
                    },
                    {
                      role: 'user',
                      content: retryPrompt,
                    },
                  ],
                  tools: providerTools.length ? providerTools : undefined,
                })
                if (retry.toolCalls?.length) {
                  const writeCalls = retry.toolCalls.filter((call) => {
                    const tool = tools.find((entry) => entry.name === call.name)
                    return tool && (tool.riskLevel === 'write' || tool.riskLevel === 'destructive')
                  })
                  if (writeCalls.length > 0) {
                    toolCalls = [...toolCalls, ...writeCalls]
                    leadContent = ''
                  }
                }
                toolCalls = expandEntityRelatedCalls({
                  content: retry.content ?? completion.content,
                  tools,
                  userMessage,
                  resolved: resolvedEntityContext,
                  existingCalls: toolCalls,
                })
                if (hasWriteToolCalls(toolCalls, tools)) {
                  leadContent = ''
                }
              }
            }
          }
        }
      }
      if (toolCalls.length === 0) {
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
      for (const call of toolCalls) {
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

      if (pendingWrites.length > 0 && deps.executor?.lookupRelatedRecord && deps.registry) {
        const attached = await attachRelatedDisplay(pendingWrites, {
          getTool: (name) => deps.registry?.get(name),
          lookup: (tool, spec, query) =>
            deps.executor!.lookupRelatedRecord!(tool, spec, ctx, query),
          lookupRecordById: async (tool, id) => {
            const getToolName = tool.name.replace(/^update_/, 'get_')
            const getTool = deps.registry?.get(getToolName)
            if (!getTool || !deps.executor) {
              return null
            }
            const result = await deps.executor.execute(
              { id: `lookup:${getToolName}:${id}`, name: getToolName, arguments: { id } },
              ctx,
              { confirmed: true },
            )
            if (!result.ok || !isRecord(result.output)) {
              return null
            }
            const data = result.output.data
            if (isRecord(data)) {
              return data
            }
            if (typeof result.output.id === 'string') {
              return result.output
            }
            return null
          },
          role: ctx.role,
        })
        pendingWrites.length = 0
        pendingWrites.push(...attached.writes)
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
        const calls = partitioned.keep.map(({ call, output }) => {
          const tool = deps.registry?.get(output.name)
          return {
            toolCallId: call.id,
            name: output.name,
            riskLevel: output.riskLevel,
            arguments: output.arguments,
            displayArguments:
              output.displayArguments ??
              (tool ? displayCreateArguments(tool, output.arguments, []) : {}),
            displayFields:
              output.displayFields ??
              (tool ? buildConfirmDisplayFields(tool, output.arguments, { role: ctx.role }) : undefined),
            relatedTree: output.relatedTree ?? [],
            summary: output.summary,
            status: 'pending_confirmation' as const,
          }
        })
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
          content: [leadContent, skippedLine, confirmLine].filter(Boolean).join('\n') || confirmLine,
          tool_name: firstWrite.call.name,
          tool_call_id: firstWrite.call.id,
          tool_payload: {
            status: 'pending_confirmation',
            toolCallId: firstWrite.call.id,
            name: firstWrite.output.name,
            riskLevel: firstWrite.output.riskLevel,
            arguments: firstWrite.output.arguments,
            displayArguments: firstWrite.output.displayArguments,
            displayFields: firstWrite.output.displayFields,
            relatedTree: firstWrite.output.relatedTree ?? [],
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
            leadContent ||
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
      return { items: messagesToDtos(rows, listedTools()) }
    },

    async sendMessage(
      ctx: AiRequestContext,
      conversationId: string,
      content: string,
      context?: DataEntityContextRef[],
    ) {
      const conversation = await getOwnedOrThrow(conversationId, ctx)
      const entityContext = dedupeEntityContext(context ?? [])
      const userMessage = await insertRow({
        conversation_id: conversation.id,
        company_id: conversation.company_id,
        role: 'user',
        content,
        tool_name: null,
        tool_call_id: null,
        tool_payload: entityContext.length > 0 ? { entityContext } : null,
      })

      if (!conversation.title) {
        await deps.repository.updateTitle(conversation.id, titleFromContent(content), userMessage.created_at)
      }

      try {
        const { provider, systemPrompt } = await deps.resolveProvider(ctx)
        const resolved = await resolveEntityContext(entityContext, {
          registry: deps.registry,
          executor: deps.executor,
          ctx,
        })
        const entityContextSupplement = formatEntityContextSupplement(resolved)
        const assistantMessage = await runProviderLoop(
          { ...ctx, conversationId: conversation.id },
          conversation,
          provider,
          systemPrompt,
          entityContextSupplement,
          resolved,
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

    async confirmToolCall(
      ctx: AiRequestContext,
      conversationId: string,
      toolCallId: string,
      options?: {
        relatedSelections?: Record<string, boolean>
        argumentOverrides?: Record<string, unknown>
        relatedArgumentOverrides?: Record<string, Record<string, unknown>>
      },
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
      const result = await deps.executor.execute(call, ctx, {
        confirmed: true,
        relatedTree: target.relatedTree,
        relatedSelections: options?.relatedSelections,
        argumentOverrides: options?.argumentOverrides,
        relatedArgumentOverrides: options?.relatedArgumentOverrides,
      })
      const output = result.output && isRecord(result.output) ? result.output : { output: result.output }
      if (!result.ok) {
        const message =
          typeof output.message === 'string' && output.message.trim()
            ? output.message
            : 'Could not add this item. It is still waiting for confirmation.'
        throw new HttpError(
          400,
          message,
          typeof output.code === 'string' ? output.code : 'TOOL_FAILED',
        )
      }
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
      target.status = 'confirmed'
      for (const item of stored) {
        if (item.status === 'pending_confirmation') {
          const refreshed = await refreshPendingCallRelatedTree(item, ctx, deps.registry, deps.executor)
          Object.assign(item, refreshed)
        }
      }
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
