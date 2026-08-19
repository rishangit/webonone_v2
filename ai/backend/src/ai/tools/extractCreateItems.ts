import { nanoid } from 'nanoid'
import { completeCreateArgs, missingRequiredArgs } from './createDefaults.js'
import type { ToolCall, ToolDefinition, ToolRole } from './registry.js'

const SPECIFIC_TOKENS = [
  'tag',
  'unit',
  'attribute',
  'product',
  'service',
  'space',
  'event',
  'staff',
  'company',
] as const

const GENERIC_TOKENS = ['catalog', 'data', 'item', 'library', 'record'] as const

const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  names: 'name',
  title: 'name',
  symbol: 'symbol',
  description: 'description',
  details: 'description',
  color: 'color',
  status: 'status',
  kind: 'kind',
  is_base: 'is_base',
  unit: 'unit_id',
  unit_id: 'unit_id',
  base_unit: 'base_unit_id',
  base_unit_id: 'base_unit_id',
  value_type: 'value_type',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stripMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function slugKey(raw: string): string {
  return stripMarkdown(raw)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function normalizeHeaderKey(header: string): string | null {
  const slug = slugKey(header)
  if (!slug || slug === 'n' || slug === 'no' || slug === 'num' || slug === 'number' || slug === 'index') {
    return null
  }
  if (HEADER_ALIASES[slug]) {
    return HEADER_ALIASES[slug]
  }
  for (const [alias, key] of Object.entries(HEADER_ALIASES)) {
    if (slug === alias || slug.startsWith(`${alias}_`) || slug.endsWith(`_${alias}`)) {
      return key
    }
  }
  return slug
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed.includes('|')) {
    return []
  }
  return trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, '')))
}

function parseJsonRecords(raw: string): Record<string, unknown>[] {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed.filter(isRecord)
    }
    if (!isRecord(parsed)) {
      return []
    }
    for (const key of ['items', 'results']) {
      const nested = parsed[key]
      if (Array.isArray(nested)) {
        return nested.filter(isRecord)
      }
    }
    if (typeof parsed.name === 'string') {
      return [parsed]
    }
    return []
  } catch {
    return []
  }
}

function extractJsonRecords(content: string): Record<string, unknown>[] {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    const fromFence = parseJsonRecords(fenced[1])
    if (fromFence.length > 0) {
      return fromFence
    }
  }
  return parseJsonRecords(content)
}

function extractTableRecords(content: string): Record<string, unknown>[] {
  const rows: string[][] = []
  for (const line of content.split(/\r?\n/)) {
    const cells = splitTableRow(line)
    if (cells.length === 0 || isSeparatorRow(cells)) {
      continue
    }
    rows.push(cells)
  }
  if (rows.length < 2) {
    return []
  }
  const keys = rows[0].map((header) => normalizeHeaderKey(header))
  if (!keys.includes('name')) {
    return []
  }
  const records: Record<string, unknown>[] = []
  for (const cells of rows.slice(1)) {
    const record: Record<string, unknown> = {}
    keys.forEach((key, index) => {
      if (!key) {
        return
      }
      const value = stripMarkdown(cells[index] ?? '')
      if (value) {
        record[key] = value
      }
    })
    if (typeof record.name === 'string' && record.name.trim()) {
      records.push(record)
    }
  }
  return records
}

const LIST_ITEM =
  /^\s*(?:\d+[.)]\s+|[-*]\s+)(?:\*\*)?([A-Za-z][A-Za-z0-9]+)(?:\*\*)?\s*(?:[-–—|:]\s+|\s+[-–—]\s+)(.+)$/

function extractListRecords(content: string): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = []
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(LIST_ITEM)
    if (!match) {
      continue
    }
    const name = stripMarkdown(match[1] ?? '')
    const description = stripMarkdown(match[2] ?? '')
    if (name && description) {
      records.push({ name, description })
    }
  }
  return records
}

export function extractRecordsFromText(content: string): Record<string, unknown>[] {
  const fromJson = extractJsonRecords(content)
  if (fromJson.length > 0) {
    return fromJson
  }
  const fromTable = extractTableRecords(content)
  if (fromTable.length > 0) {
    return fromTable
  }
  return extractListRecords(content)
}

function schemaPropertyMap(schema: Record<string, unknown>): Record<string, unknown> {
  return isRecord(schema.properties) ? schema.properties : {}
}

function coerceSchemaValue(prop: unknown, value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }
  const trimmed = value.trim()
  if (!trimmed || /^(n\/a|none|null|-)$/i.test(trimmed)) {
    return undefined
  }
  if (!isRecord(prop)) {
    return trimmed
  }
  if (prop.type === 'boolean') {
    const lower = trimmed.toLowerCase()
    if (lower === 'true' || lower === 'yes' || lower === '1') {
      return true
    }
    if (lower === 'false' || lower === 'no' || lower === '0') {
      return false
    }
  }
  return trimmed
}

function coerceRecordToSchema(
  tool: Pick<ToolDefinition, 'jsonSchema'>,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const props = schemaPropertyMap(tool.jsonSchema)
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    const coerced = coerceSchemaValue(props[key], value)
    if (coerced !== undefined) {
      next[key] = coerced
    }
  }
  return next
}

function isCreateWriteTool(tool: ToolDefinition): boolean {
  return tool.riskLevel === 'write' && tool.name.startsWith('create_')
}

function filledArgs(
  tool: ToolDefinition,
  record: Record<string, unknown>,
  role: ToolRole,
): Record<string, unknown> | null {
  const args = completeCreateArgs(tool, coerceRecordToSchema(tool, record), role)
  if (missingRequiredArgs(tool.jsonSchema, args).length > 0) {
    return null
  }
  return args
}

function toolTokens(tool: ToolDefinition): string[] {
  return tool.name
    .replace(/^create_/, '')
    .split('_')
    .map((part) => part.toLowerCase())
    .filter((part) => part.length >= 3)
}

function scoreTool(tool: ToolDefinition, haystack: string): number {
  const text = haystack.toLowerCase()
  let score = 0
  for (const token of toolTokens(tool)) {
    const pattern = new RegExp(`\\b${token}s?\\b`, 'i')
    if (!pattern.test(text)) {
      continue
    }
    if ((SPECIFIC_TOKENS as readonly string[]).includes(token)) {
      score += 3
    } else if ((GENERIC_TOKENS as readonly string[]).includes(token)) {
      score += 1
    } else {
      score += 2
    }
  }
  return score
}

export function listedCreateNames(calls: ToolCall[]): string[] {
  const names: string[] = []
  for (const call of calls) {
    if (!call.name.startsWith('create_')) {
      continue
    }
    const name = typeof call.arguments?.name === 'string' ? call.arguments.name.trim() : ''
    if (name) {
      names.push(name)
    }
  }
  return names
}

export function requiredCreateKeys(tool: Pick<ToolDefinition, 'jsonSchema'>): string[] {
  const required = Array.isArray(tool.jsonSchema.required)
    ? tool.jsonSchema.required.filter((key): key is string => typeof key === 'string')
    : []
  return required.length > 0 ? required : ['name', 'description']
}

export function suggestCreateKeys(
  tool: Pick<ToolDefinition, 'jsonSchema' | 'argCompletion' | 'relatedArgs'>,
): string[] {
  const props = Object.keys(schemaPropertyMap(tool.jsonSchema))
  const allowed = tool.argCompletion?.allowedKeys
  const keys = allowed ? props.filter((key) => allowed.includes(key)) : props
  const ordered = [...requiredCreateKeys(tool)]
  for (const key of keys) {
    if (!ordered.includes(key)) {
      ordered.push(key)
    }
  }
  const related = tool.relatedArgs ?? []
  return ordered.map((key) => related.find((item) => item.argKey === key)?.displayKey ?? key)
}

export function relatedIdKeys(tool: Pick<ToolDefinition, 'jsonSchema' | 'argCompletion' | 'relatedArgs'>): string[] {
  return suggestCreateKeys(tool).filter((key) => /_ids?$/i.test(key))
}

function relatedItemsHint(
  tool?: Pick<ToolDefinition, 'jsonSchema' | 'argCompletion' | 'relatedArgs'> | null,
): string {
  if (!tool) {
    return ' For related records, put the related name (and symbol) instead of an opaque id. Never invent ids.'
  }
  const related = tool.relatedArgs ?? []
  if (related.length > 0) {
    const labels = related.map((item) => item.displayKey).join(', ')
    return ` Related columns (${labels}): put the related record name (and other create properties if it is new), not an opaque id. Existing records are matched by name; missing related records nest under the parent confirm row with checkboxes.`
  }
  const ids = relatedIdKeys(tool)
  if (ids.length === 0) {
    return ' List related library records first when they help the user confirm. Never invent ids.'
  }
  return ` Related columns (${ids.join(', ')}): put the related record name, not an opaque id. Never invent ids.`
}

export function pickCreateToolFromHint(tools: ToolDefinition[], hint: string): ToolDefinition | null {
  const scored = tools
    .filter(isCreateWriteTool)
    .map((tool) => ({ tool, score: scoreTool(tool, hint) }))
    .filter((entry) => entry.score > 0)
  if (scored.length === 0) {
    return null
  }
  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]
  const second = scored[1]
  if (!best || best.score <= 0 || (second && best.score === second.score)) {
    return null
  }
  return best.tool
}

export function resolveCreateTool(options: {
  tools: ToolDefinition[]
  existingCalls: ToolCall[]
  userMessage: string
}): ToolDefinition | null {
  const preferredName = options.existingCalls.find((call) => call.name.startsWith('create_'))?.name
  if (preferredName) {
    const found = options.tools.find((tool) => tool.name === preferredName && isCreateWriteTool(tool))
    if (found) {
      return found
    }
  }
  return pickCreateToolFromHint(options.tools, options.userMessage)
}

export function remainingItemsTablePrompt(
  requested: number,
  excludeNames: string[],
  tool?: Pick<ToolDefinition, 'jsonSchema' | 'argCompletion' | 'relatedArgs'> | null,
): string {
  const have = new Set(excludeNames.map((name) => name.trim()).filter(Boolean))
  const remaining = Math.max(1, requested - have.size)
  const keys = tool ? suggestCreateKeys(tool) : ['name', 'description']
  const columns = keys.join(' | ')
  const pascal = tool?.argCompletion?.pascalCaseKeys?.includes('name')
    ? ' Names start with a capital letter (PascalCase, no spaces), for example PharmacyInventory not pharmacyInventory. Description is "Spaced Name - 1-3 sentences".'
    : ' Fill every column with a complete suggested value, including optional properties.'
  const avoid = have.size > 0 ? ` Do not reuse these names: ${[...have].join(', ')}.` : ''
  return `The user asked for ${requested} items. Reply with a markdown table of exactly ${remaining} items. Columns: ${columns}.${pascal}${relatedItemsHint(tool)} One row per item.${avoid} Output only the table. Do not call tools.`
}

export function remainingCreateCallsPrompt(
  requested: number,
  tool?: Pick<ToolDefinition, 'name' | 'jsonSchema' | 'argCompletion' | 'relatedArgs'> | null,
): string {
  const keys = tool ? suggestCreateKeys(tool).join(', ') : 'every schema property (required and optional)'
  const toolName = tool?.name ?? 'create_*'
  return `The user asked for ${requested} items. Call ${toolName} once per item for all ${requested} items in this turn. Include ${keys} on every call.${relatedItemsHint(tool)} Do not stop after one item.`
}

export function requestedItemCount(message: string): number | null {
  const match = message.match(
    /\b(\d{1,2})(?:\s+\w+){0,3}\s+(tags?|units?|attributes?|products?|services?|spaces?|items?)\b/i,
  )
  if (!match) {
    return null
  }
  const count = Number(match[1])
  if (!Number.isInteger(count) || count < 2 || count > 25) {
    return null
  }
  return count
}

function createCallKey(call: ToolCall): string | null {
  if (!call.name.startsWith('create_')) {
    return null
  }
  const name = typeof call.arguments?.name === 'string' ? call.arguments.name.trim().toLowerCase() : ''
  return name ? `${call.name}:${name}` : `${call.name}:${call.id}`
}

export function uniqueCreateNameCount(calls: ToolCall[]): number {
  const names = new Set<string>()
  for (const call of calls) {
    const key = createCallKey(call)
    if (key) {
      names.add(key)
    }
  }
  return names.size
}

export function mergeUniqueCreateCalls(base: ToolCall[], extra: ToolCall[]): ToolCall[] {
  const seen = new Set<string>()
  const merged: ToolCall[] = []
  for (const call of [...base, ...extra]) {
    const key = createCallKey(call)
    if (!key) {
      merged.push(call)
      continue
    }
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    merged.push(call)
  }
  return merged
}

export function pickCreateTool(
  tools: ToolDefinition[],
  records: Record<string, unknown>[],
  role: ToolRole,
  hint: string,
): ToolDefinition | null {
  const candidates = tools.filter(isCreateWriteTool)
  const scored = candidates
    .map((tool) => ({
      tool,
      fillCount: records.filter((record) => filledArgs(tool, record, role) != null).length,
      score: scoreTool(tool, hint),
    }))
    .filter((entry) => entry.fillCount > 0)
  if (scored.length === 0) {
    return null
  }
  if (scored.length === 1) {
    return scored[0].tool
  }
  scored.sort((a, b) => b.score - a.score || b.fillCount - a.fillCount)
  const best = scored[0]
  const second = scored[1]
  if (best.score <= 0 || best.score === second.score) {
    return null
  }
  return best.tool
}

export function liftCreateCallsFromText(options: {
  content: string
  tools: ToolDefinition[]
  userMessage: string
  role: ToolRole
  preferredToolName?: string
}): { tool: ToolDefinition; calls: ToolCall[] } | null {
  const records = extractRecordsFromText(options.content)
  if (records.length === 0) {
    return null
  }
  const preferred = options.preferredToolName
    ? options.tools.find((tool) => tool.name === options.preferredToolName && isCreateWriteTool(tool))
    : undefined
  const headerHint = options.content.split(/\r?\n/).slice(0, 8).join(' ')
  const tool =
    preferred && records.some((record) => filledArgs(preferred, record, options.role) != null)
      ? preferred
      : pickCreateTool(
          options.tools,
          records,
          options.role,
          `${options.userMessage}\n${headerHint}`,
        )
  if (!tool) {
    return null
  }
  const calls: ToolCall[] = []
  for (const record of records) {
    const args = filledArgs(tool, record, options.role)
    if (!args) {
      continue
    }
    calls.push({
      id: nanoid(),
      name: tool.name,
      arguments: args,
    })
  }
  return calls.length > 0 ? { tool, calls } : null
}

export function expandCreateCalls(options: {
  content: string
  tools: ToolDefinition[]
  userMessage: string
  role: ToolRole
  existingCalls: ToolCall[]
}): ToolCall[] {
  const preferredToolName = options.existingCalls.find((call) => call.name.startsWith('create_'))?.name
  const lifted = liftCreateCallsFromText({
    content: options.content,
    tools: options.tools,
    userMessage: options.userMessage,
    role: options.role,
    preferredToolName,
  })
  if (!lifted) {
    return options.existingCalls
  }
  return mergeUniqueCreateCalls(options.existingCalls, lifted.calls)
}
