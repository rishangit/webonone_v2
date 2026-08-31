import { nanoid } from 'nanoid'
import {
  getUpdateToolNameForDataEntityKind,
} from '../entityContext/resolveEntityContext.js'
import type { ResolvedEntityContext } from '../entityContext/types.js'
import { extractRecordsFromText, suggestCreateKeys } from './extractCreateItems.js'
import type { ToolCall, ToolDefinition } from './registry.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stripMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim()
}

export function isRelatedSuggestionIntent(message: string): boolean {
  const text = message.toLowerCase()
  const hasTarget = /\b(attribute|tag|unit|variant|tags|attributes|units|variants)\b/.test(text)
  const hasAction =
    /\b(suggest|add|fill|missing|attach|link|related|have|need|want|can we|could we)\b/.test(text)
  return hasAction && hasTarget
}

export function isAttributeUnitIntent(message: string, kind?: string): boolean {
  if (kind && kind !== 'attribute') {
    return false
  }
  return /\bunits?\b/.test(message.toLowerCase())
}

export function hasWriteToolCalls(calls: ToolCall[], tools: ToolDefinition[]): boolean {
  for (const call of calls) {
    const tool = tools.find((entry) => entry.name === call.name)
    if (tool && (tool.riskLevel === 'write' || tool.riskLevel === 'destructive')) {
      return true
    }
  }
  return false
}

function relatedItemsHint(tool: Pick<ToolDefinition, 'relatedArgs'>): string {
  const related = tool.relatedArgs ?? []
  if (related.length === 0) {
    return ''
  }
  const labels = related.map((item) => item.displayKey).join(', ')
  return ` Related columns (${labels}): put the related record name (and other create properties if it is new), not an opaque id. Existing records are matched by name; missing related records nest under the parent confirm row with checkboxes.`
}

export function pickRelatedDisplayKey(
  userMessage: string,
  tool: ToolDefinition,
  entityKind?: string,
): string | null {
  const text = userMessage.toLowerCase()
  const related = tool.relatedArgs ?? []
  if (entityKind === 'attribute' && /\bunits?\b/.test(text)) {
    return related.find((item) => item.displayKey === 'unit')?.displayKey ?? 'unit'
  }
  if (/\battributes?\b/.test(text)) {
    return related.find((item) => item.displayKey === 'attributes')?.displayKey ?? 'attributes'
  }
  if (/\btags?\b/.test(text)) {
    return related.find((item) => item.displayKey === 'tags')?.displayKey ?? 'tags'
  }
  if (/\bunits?\b/.test(text) && related.some((item) => item.displayKey === 'unit')) {
    return 'unit'
  }
  if (/\bbase[_\s-]?unit\b/.test(text)) {
    return related.find((item) => item.displayKey === 'base_unit')?.displayKey ?? null
  }
  if (related.some((item) => item.displayKey === 'attributes')) {
    return 'attributes'
  }
  return related[0]?.displayKey ?? null
}

function parseUnitMentions(content: string): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = []
  const pattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\(([a-zA-Z%/°]+)\)/g
  for (const match of content.matchAll(pattern)) {
    const name = stripMarkdown(match[1] ?? '')
    const symbol = stripMarkdown(match[2] ?? '')
    if (name && symbol && name.length <= 40) {
      records.push({
        name,
        symbol,
        description: `${name} (${symbol}) - Suggested unit of measure.`,
      })
    }
  }
  return records
}

function parseRelatedSuggestionRecords(content: string): Record<string, unknown>[] {
  const fromExtract = extractRecordsFromText(content)
  if (fromExtract.length > 0) {
    return fromExtract
  }

  const fromUnits = parseUnitMentions(content)
  if (fromUnits.length > 0) {
    return fromUnits
  }

  const records: Record<string, unknown>[] = []
  const numbered =
    /^\s*\d+[.)]\s+\*{0,2}([^*\n]+?)\*{0,2}\s*(?:\(([^)]+)\))?\s*[-–—:]\s*(.+)$/
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(numbered)
    if (!match) {
      continue
    }
    const name = stripMarkdown(match[1] ?? '')
    const typeHint = (match[2] ?? '').trim().toLowerCase()
    const description = stripMarkdown(match[3] ?? '')
    if (!name || !description) {
      continue
    }
    const record: Record<string, unknown> = { name, description }
    if (typeHint.includes('number')) {
      record.value_type = 'number'
    } else if (typeHint.includes('text')) {
      record.value_type = 'text'
    }
    records.push(record)
  }
  return records
}

function buildRelatedValue(
  displayKey: string,
  records: Record<string, unknown>[],
): unknown {
  if (displayKey === 'attributes') {
    return records.map((record) => {
      const item: Record<string, unknown> = {
        name: record.name,
        description: record.description,
        value_type: record.value_type ?? 'text',
      }
      if (isRecord(record.unit)) {
        item.unit = record.unit
      }
      return item
    })
  }
  if (displayKey === 'tags') {
    return records.map((record) => ({
      name: record.name,
      description:
        typeof record.description === 'string'
          ? record.description
          : `${String(record.name)} - Suggested related record.`,
    }))
  }
  if (displayKey === 'unit' || displayKey === 'base_unit') {
    const first = records[0]
    if (!first || typeof first.name !== 'string') {
      return null
    }
    return first
  }
  return null
}

function parentNameFromResolved(primary: ResolvedEntityContext): string | undefined {
  const fromRef = primary.ref.label?.trim()
  if (fromRef) {
    return fromRef
  }
  const fromRecord = primary.record?.name
  return typeof fromRecord === 'string' && fromRecord.trim() ? fromRecord.trim() : undefined
}

function defaultUnitSuggestion(attributeName: string): Record<string, unknown> {
  const lower = attributeName.toLowerCase()
  if (/\b(weight|mass)\b/.test(lower)) {
    return {
      name: 'Gram',
      symbol: 'g',
      description: 'Gram (g) - Unit of mass for weight measurements.',
    }
  }
  return {
    name: 'Unit',
    symbol: 'u',
    description: 'Unit - Suggested unit of measure for this attribute.',
  }
}

export function liftEntityRelatedUpdateCall(options: {
  content: string
  tools: ToolDefinition[]
  userMessage: string
  resolved: ResolvedEntityContext[]
}): ToolCall | null {
  const primary = options.resolved.find((item) => item.record && !item.error)
  if (!primary || primary.ref.service !== 'data') {
    return null
  }

  const updateToolName = getUpdateToolNameForDataEntityKind(primary.ref.kind)
  const tool = options.tools.find((entry) => entry.name === updateToolName)
  if (!tool?.relatedArgs?.length) {
    return null
  }

  let records = parseRelatedSuggestionRecords(options.content)
  const displayKey =
    pickRelatedDisplayKey(options.userMessage, tool, primary.ref.kind) ??
    pickRelatedDisplayKey(options.userMessage, tool)
  if (!displayKey) {
    return null
  }

  if (
    records.length === 0 &&
    isAttributeUnitIntent(options.userMessage, primary.ref.kind) &&
    displayKey === 'unit'
  ) {
    const attributeName = parentNameFromResolved(primary) ?? 'attribute'
    records = [defaultUnitSuggestion(attributeName)]
  }

  if (records.length === 0) {
    return null
  }

  const relatedValue = buildRelatedValue(displayKey, records)
  if (relatedValue == null) {
    return null
  }

  const parentName = parentNameFromResolved(primary)
  return {
    id: nanoid(),
    name: tool.name,
    arguments: {
      id: primary.ref.id,
      ...(parentName ? { name: parentName } : {}),
      [displayKey]: relatedValue,
    },
  }
}

export function entityRelatedRetryPrompt(
  resolved: ResolvedEntityContext[],
  tool: ToolDefinition,
  userMessage: string,
): string {
  const primary = resolved.find((item) => item.record)
  const keys = suggestCreateKeys(tool).join(', ')
  const displayKey =
    pickRelatedDisplayKey(userMessage, tool, primary?.ref.kind) ??
    pickRelatedDisplayKey(userMessage, tool) ??
    'related items'
  const unitHint =
    primary?.ref.kind === 'attribute' && displayKey === 'unit'
      ? ' For a number attribute, include unit with name, symbol, and description (for example Gram / g).'
      : ''
  const parentName = primary ? parentNameFromResolved(primary) : undefined
  return `The user asked to ${userMessage.trim()}. Call ${tool.name} once with id ${primary?.ref.id}${parentName ? ` and name ${parentName}` : ''} and only NEW ${displayKey} data in the ${displayKey} field. Include ${keys} for each new related item.${unitHint}${relatedItemsHint(tool)} Do not reply in prose — call the write tool so the UI can show Confirm/Skip.`
}

export function expandEntityRelatedCalls(options: {
  content: string
  tools: ToolDefinition[]
  userMessage: string
  resolved: ResolvedEntityContext[]
  existingCalls: ToolCall[]
}): ToolCall[] {
  if (!isRelatedSuggestionIntent(options.userMessage)) {
    const primary = options.resolved.find((item) => item.record && !item.error)
    if (!primary || primary.ref.service !== 'data' || !isAttributeUnitIntent(options.userMessage, primary.ref.kind)) {
      return options.existingCalls
    }
  }
  if (hasWriteToolCalls(options.existingCalls, options.tools)) {
    return options.existingCalls
  }
  if (options.resolved.length === 0) {
    return options.existingCalls
  }

  const lifted = liftEntityRelatedUpdateCall({
    content: options.content,
    tools: options.tools,
    userMessage: options.userMessage,
    resolved: options.resolved,
  })
  if (!lifted) {
    return options.existingCalls
  }
  if (options.existingCalls.some((call) => call.name === lifted.name)) {
    return options.existingCalls
  }
  return [...options.existingCalls, lifted]
}
