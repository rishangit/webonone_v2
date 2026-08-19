import type { RelatedNode, ToolCall, ToolDefinition } from './registry.js'

export type PendingWrite = {
  call: ToolCall
  output: {
    name: string
    riskLevel: string
    arguments: Record<string, unknown>
    displayArguments?: Record<string, unknown>
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
