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

function isCreateWriteTool(tool: ToolDefinition): boolean {
  return tool.riskLevel === 'write' && tool.name.startsWith('create_')
}

function filledArgs(
  tool: ToolDefinition,
  record: Record<string, unknown>,
  role: ToolRole,
): Record<string, unknown> | null {
  const args = completeCreateArgs(tool, record, role)
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

export function remainingItemsTablePrompt(requested: number, excludeNames: string[]): string {
  const have = new Set(excludeNames.map((name) => name.trim()).filter(Boolean))
  const remaining = Math.max(1, requested - have.size)
  const avoid = have.size > 0 ? ` Do not reuse these names: ${[...have].join(', ')}.` : ''
  return `The user asked for ${requested} items. Reply with a markdown table of exactly ${remaining} items. Columns: name | description. Names start with a capital letter (PascalCase, no spaces), for example PharmacyInventory not pharmacyInventory. Description is "Spaced Name - 1-3 sentences". One row per item.${avoid} Output only the table. Do not call tools.`
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
