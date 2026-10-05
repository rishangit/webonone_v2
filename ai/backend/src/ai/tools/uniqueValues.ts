import type { ConfirmDisplayField } from './confirmDisplay.js'
import type { RelatedNode, ToolCall, ToolDefinition } from './registry.js'

export type PendingWrite = {
  call: ToolCall
  output: {
    name: string
    riskLevel: string
    arguments: Record<string, unknown>
    displayArguments?: Record<string, unknown>
    displayFields?: ConfirmDisplayField[]
    relatedTree?: RelatedNode[]
    summary: string
  }
}

export function normalizeUniqueValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed || null
}

export function collectUniqueLookupGroups(
  calls: ToolCall[],
  getTool: (name: string) => ToolDefinition | undefined,
): Map<string, { tool: ToolDefinition; values: string[] }> {
  const valuesByTool = new Map<string, { tool: ToolDefinition; values: string[] }>()
  for (const call of calls) {
    const tool = getTool(call.name)
    const uniqueBy = tool?.argCompletion?.uniqueBy
    if (!tool || !uniqueBy || !tool.argCompletion?.uniqueLookup) {
      continue
    }
    const value = normalizeUniqueValue(call.arguments[uniqueBy])
    if (!value) {
      continue
    }
    const group = valuesByTool.get(tool.name) ?? { tool, values: [] }
    group.values.push(value)
    valuesByTool.set(tool.name, group)
  }
  return valuesByTool
}

/** Drop create calls whose uniqueBy value already exists in the library (generic uniqueLookup). */
export function dropCreateCallsWithExistingNames(
  calls: ToolCall[],
  getTool: (name: string) => ToolDefinition | undefined,
  existingNamesByTool: Map<string, Set<string>>,
): { kept: ToolCall[]; skippedExisting: string[] } {
  const kept: ToolCall[] = []
  const skippedExisting: string[] = []
  for (const call of calls) {
    const tool = getTool(call.name)
    const uniqueBy = tool?.argCompletion?.uniqueBy
    if (!tool || !uniqueBy || !tool.argCompletion?.uniqueLookup) {
      kept.push(call)
      continue
    }
    const value = normalizeUniqueValue(call.arguments[uniqueBy])
    if (!value) {
      kept.push(call)
      continue
    }
    const existing = existingNamesByTool.get(tool.name)
    if (existing?.has(value.toLowerCase())) {
      skippedExisting.push(value)
      continue
    }
    kept.push(call)
  }
  return { kept, skippedExisting }
}

export function partitionUniquePendingWrites(
  writes: PendingWrite[],
  getTool: (name: string) => ToolDefinition | undefined,
  existingNamesByTool: Map<string, Set<string>>,
): { keep: PendingWrite[]; skippedExisting: string[]; skippedDuplicates: string[] } {
  const keep: PendingWrite[] = []
  const skippedExisting: string[] = []
  const skippedDuplicates: string[] = []
  const seenByTool = new Map<string, Set<string>>()

  for (const write of writes) {
    const tool = getTool(write.call.name)
    const uniqueBy = tool?.argCompletion?.uniqueBy
    if (!tool || !uniqueBy || !tool.argCompletion?.uniqueLookup) {
      keep.push(write)
      continue
    }
    const value = normalizeUniqueValue(write.output.arguments[uniqueBy])
    if (!value) {
      keep.push(write)
      continue
    }
    const key = value.toLowerCase()
    const existing = existingNamesByTool.get(tool.name)
    if (existing?.has(key)) {
      skippedExisting.push(value)
      continue
    }
    const seen = seenByTool.get(tool.name) ?? new Set<string>()
    if (seen.has(key)) {
      skippedDuplicates.push(value)
      continue
    }
    seen.add(key)
    seenByTool.set(tool.name, seen)
    keep.push(write)
  }

  return { keep, skippedExisting, skippedDuplicates }
}
