import { coercePropertyValue, completeCreateArgs, missingRequiredArgs } from './createDefaults.js'
import { formatRecordLines } from './formatRecord.js'
import type { RelatedArg, RelatedNode, ToolDefinition, ToolResult, ToolRole } from './registry.js'
import type { PendingWrite } from './uniqueValues.js'

const RELATED_DEPTH = 3

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isHiddenConfirmKey(key: string): boolean {
  return key === 'id' || /_ids?$/i.test(key)
}

export function looksLikeRecordId(value: string): boolean {
  const trimmed = value.trim()
  if (!/^[A-Za-z0-9_-]{21}$/.test(trimmed)) {
    return false
  }
  return !/^[A-Za-z]+$/.test(trimmed)
}

export function relatedNameFromValue(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  return match?.[1]?.trim() || trimmed
}

export function parseRelatedNameHint(value: unknown): { name: string; symbol?: string } | null {
  if (isRecord(value)) {
    const name = typeof value.name === 'string' ? value.name.trim() : ''
    if (!name || looksLikeRecordId(name)) {
      return null
    }
    const symbol = typeof value.symbol === 'string' && value.symbol.trim() ? value.symbol.trim() : undefined
    return symbol ? { name, symbol } : { name }
  }
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (!trimmed || looksLikeRecordId(trimmed)) {
    return null
  }
  const match = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  if (match?.[1]?.trim() && match[2]?.trim()) {
    return { name: match[1].trim(), symbol: match[2].trim() }
  }
  return { name: trimmed }
}

export function publicConfirmRecord(record: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isHiddenConfirmKey(key) || value === undefined || value === null || value === '') {
      continue
    }
    if (Array.isArray(value)) {
      next[key] = value.map((entry) => (isRecord(entry) ? publicConfirmRecord(entry) : entry))
      continue
    }
    if (isRecord(value)) {
      next[key] = publicConfirmRecord(value)
      continue
    }
    next[key] = value
  }
  return next
}

function camelCaseKey(key: string): string {
  return key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

export function schemaPropertyArgs(
  schema: Record<string, unknown>,
  args: Record<string, unknown>,
): Record<string, unknown> {
  const props = isRecord(schema.properties) ? schema.properties : {}
  const next: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    let value = args[key]
    if (value === undefined) {
      const camel = camelCaseKey(key)
      if (camel !== key && args[camel] !== undefined) {
        value = args[camel]
      }
    }
    const coerced = coercePropertyValue(props[key], value)
    if (coerced !== undefined) {
      next[key] = coerced
    }
  }
  return next
}

function humanizeName(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim()
}

export function relatedCreateArgs(
  createTool: Pick<ToolDefinition, 'jsonSchema' | 'argCompletion' | 'name'>,
  hint: Record<string, unknown>,
  role: ToolRole,
): Record<string, unknown> {
  const parsed = parseRelatedNameHint(hint.name ?? hint)
  const props = isRecord(createTool.jsonSchema.properties) ? createTool.jsonSchema.properties : {}
  const seeded: Record<string, unknown> = { ...hint }
  if (parsed?.name) {
    seeded.name = parsed.name
  }
  if (parsed?.symbol && seeded.symbol == null) {
    seeded.symbol = parsed.symbol
  }
  if (typeof seeded.description !== 'string' || !seeded.description.trim()) {
    const name = typeof seeded.name === 'string' ? seeded.name : 'Related record'
    seeded.description = `${humanizeName(name)} - Suggested related record.`
  }
  return completeCreateArgs(createTool, schemaPropertyArgs({ properties: props }, seeded), role)
}

export type RelatedLookup = (
  spec: RelatedArg,
  query: { id?: string; name?: string },
) => Promise<Record<string, unknown> | null>

function relatedCardinality(spec: RelatedArg): 'one' | 'many' {
  return spec.cardinality === 'many' ? 'many' : 'one'
}

function hintAsRecord(hint: unknown): Record<string, unknown> {
  if (isRecord(hint)) {
    return hint
  }
  if (typeof hint === 'string') {
    const parsed = parseRelatedNameHint(hint)
    return parsed ? { ...parsed } : { name: hint }
  }
  return {}
}

function collectHints(args: Record<string, unknown>, spec: RelatedArg): unknown[] {
  const display = args[spec.displayKey]
  const raw = args[spec.argKey]
  if (relatedCardinality(spec) === 'many') {
    if (Array.isArray(display)) {
      return display
    }
    if (Array.isArray(raw)) {
      return raw
    }
    if (display != null && display !== '') {
      return [display]
    }
    if (raw != null && raw !== '') {
      return [raw]
    }
    return []
  }
  if (display != null && display !== '') {
    return [display]
  }
  if (raw != null && raw !== '') {
    return [raw]
  }
  return []
}

async function resolveHintRecord(
  spec: RelatedArg,
  hint: unknown,
  lookup: RelatedLookup,
): Promise<Record<string, unknown> | null> {
  const nested = isRecord(hint) ? hint : null
  const rawId =
    typeof hint === 'string' && looksLikeRecordId(hint)
      ? hint.trim()
      : typeof nested?.id === 'string' && looksLikeRecordId(nested.id)
        ? nested.id.trim()
        : typeof nested?.[spec.itemIdKey ?? ''] === 'string' &&
            looksLikeRecordId(String(nested[spec.itemIdKey ?? '']))
          ? String(nested[spec.itemIdKey ?? '']).trim()
          : undefined
  if (rawId) {
    const byId = await lookup(spec, { id: rawId })
    if (byId) {
      return byId
    }
  }
  const parsed = parseRelatedNameHint(hint)
  const name = parsed?.name ?? (typeof nested?.name === 'string' ? nested.name.trim() : '')
  if (name && !looksLikeRecordId(name)) {
    return lookup(spec, { name })
  }
  return null
}

export async function buildRelatedTree(
  tool: Pick<ToolDefinition, 'name' | 'relatedArgs' | 'jsonSchema'>,
  args: Record<string, unknown>,
  options: {
    getTool: (name: string) => ToolDefinition | undefined
    lookup: RelatedLookup
    role: ToolRole
    pathPrefix?: string
    depth?: number
    visited?: Set<string>
  },
): Promise<RelatedNode[]> {
  const depth = options.depth ?? 0
  if (depth >= RELATED_DEPTH) {
    return []
  }
  const visited = options.visited ?? new Set<string>()
  const parentName = typeof args.name === 'string' ? args.name.trim().toLowerCase() : ''
  const nodes: RelatedNode[] = []
  for (const spec of tool.relatedArgs ?? []) {
    const hints = collectHints(args, spec)
    let index = 0
    for (const hint of hints) {
      const parsed = parseRelatedNameHint(hint)
      const hintRecord = hintAsRecord(hint)
      const hintName = parsed?.name ?? (typeof hintRecord.name === 'string' ? hintRecord.name.trim() : '')
      if (relatedCardinality(spec) === 'one' && parentName && hintName.toLowerCase() === parentName) {
        continue
      }
      if (!hintName && !isRecord(hint) && typeof hint !== 'string') {
        continue
      }
      const path = options.pathPrefix
        ? `${options.pathPrefix}/${spec.displayKey}/${index}`
        : `${spec.displayKey}/${index}`
      index += 1
      const existing = await resolveHintRecord(spec, hint, options.lookup)
      if (existing && typeof existing.id === 'string') {
        nodes.push({
          path,
          displayKey: spec.displayKey,
          exists: true,
          selected: true,
          record: publicConfirmRecord(existing),
          recordId: existing.id,
        })
        continue
      }
      const createTool = options.getTool(spec.createTool)
      if (!createTool || createTool.riskLevel !== 'write') {
        continue
      }
      const createArgs = relatedCreateArgs(createTool, hintRecord, options.role)
      const missing = missingRequiredArgs(createTool.jsonSchema, createArgs)
      const createdName = typeof createArgs.name === 'string' ? createArgs.name.trim() : ''
      if (missing.length > 0 || !createdName) {
        continue
      }
      const visitKey = `${createTool.name}:${createdName.toLowerCase()}`
      const childVisited = new Set(visited)
      childVisited.add(visitKey)
      let children: RelatedNode[] = []
      if (!visited.has(visitKey)) {
        children = await buildRelatedTree(createTool, createArgs, {
          ...options,
          pathPrefix: path,
          depth: depth + 1,
          visited: childVisited,
        })
      }
      nodes.push({
        path,
        displayKey: spec.displayKey,
        exists: false,
        selected: true,
        record: publicConfirmRecord(createArgs),
        createTool: createTool.name,
        createArgs,
        children: children.length > 0 ? children : undefined,
      })
    }
  }
  return nodes
}

export function displayArgumentsFromTree(
  args: Record<string, unknown>,
  tool: Pick<ToolDefinition, 'relatedArgs'>,
  _tree: RelatedNode[],
): Record<string, unknown> {
  const relatedKeys = new Set((tool.relatedArgs ?? []).flatMap((spec) => [spec.argKey, spec.displayKey]))
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(args)) {
    if (isHiddenConfirmKey(key) || relatedKeys.has(key) || isRecord(value) || Array.isArray(value)) {
      continue
    }
    next[key] = value
  }
  return next
}

export function displayCreateArguments(
  args: Record<string, unknown>,
  related: Array<{ displayKey: string; record: Record<string, unknown> | null }>,
): Record<string, unknown> {
  const hidden = new Set(related.map((item) => item.displayKey))
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(args)) {
    if (isHiddenConfirmKey(key) || hidden.has(key)) {
      continue
    }
    next[key] = value
  }
  for (const item of related) {
    if (item.record && Object.keys(item.record).length > 0) {
      next[item.displayKey] = publicConfirmRecord(item.record)
    }
  }
  return next
}

export function parseRelatedNode(raw: unknown): RelatedNode | null {
  if (!isRecord(raw) || typeof raw.path !== 'string' || typeof raw.displayKey !== 'string') {
    return null
  }
  const children = Array.isArray(raw.children)
    ? raw.children.map(parseRelatedNode).filter((node): node is RelatedNode => node != null)
    : undefined
  return {
    path: raw.path,
    displayKey: raw.displayKey,
    exists: raw.exists === true,
    selected: raw.selected !== false,
    record: isRecord(raw.record) ? raw.record : {},
    createTool: typeof raw.createTool === 'string' ? raw.createTool : undefined,
    createArgs: isRecord(raw.createArgs) ? raw.createArgs : undefined,
    recordId: typeof raw.recordId === 'string' ? raw.recordId : undefined,
    children: children && children.length > 0 ? children : undefined,
  }
}

export function parseRelatedTree(raw: unknown): RelatedNode[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map(parseRelatedNode).filter((node): node is RelatedNode => node != null)
}

export function applyRelatedSelections(
  tree: RelatedNode[],
  selections?: Record<string, boolean>,
): RelatedNode[] {
  return tree.map((node) => {
    const selected = node.exists ? true : (selections?.[node.path] ?? node.selected)
    return {
      ...node,
      selected,
      children: node.children ? applyRelatedSelections(node.children, selections) : undefined,
    }
  })
}

function executedId(result: ToolResult): string | null {
  if (!result.ok || !isRecord(result.output)) {
    return null
  }
  const data = result.output.data
  if (isRecord(data) && typeof data.id === 'string' && data.id.trim()) {
    return data.id
  }
  if (typeof result.output.id === 'string' && result.output.id.trim()) {
    return result.output.id
  }
  return null
}

function nodeIsIncluded(node: RelatedNode): boolean {
  return node.exists || node.selected
}

export async function materializeRelatedTree(
  tool: Pick<ToolDefinition, 'relatedArgs'>,
  args: Record<string, unknown>,
  tree: RelatedNode[],
  options: {
    getTool: (name: string) => ToolDefinition | undefined
    execute: (call: { name: string; arguments: Record<string, unknown> }) => Promise<ToolResult>
    createdIds: Map<string, string>
  },
): Promise<{ arguments: Record<string, unknown>; error?: ToolResult }> {
  const next = { ...args }
  for (const spec of tool.relatedArgs ?? []) {
    const specNodes = tree.filter((node) => node.displayKey === spec.displayKey && nodeIsIncluded(node))
    const ids: string[] = []
    for (const node of specNodes) {
      if (node.exists && node.recordId) {
        ids.push(node.recordId)
        continue
      }
      if (!node.selected || !node.createTool || !node.createArgs) {
        continue
      }
      const createTool = options.getTool(node.createTool)
      const createdName = typeof node.createArgs.name === 'string' ? node.createArgs.name.trim().toLowerCase() : ''
      const cacheKey = `${node.createTool}:${createdName}`
      const cached = options.createdIds.get(cacheKey)
      if (cached) {
        ids.push(cached)
        continue
      }
      let createArgs = { ...node.createArgs }
      if (createTool && node.children && node.children.length > 0) {
        const nested = await materializeRelatedTree(createTool, createArgs, node.children, options)
        if (nested.error) {
          return nested
        }
        createArgs = nested.arguments
      }
      const created = await options.execute({ name: node.createTool, arguments: createArgs })
      if (!created.ok) {
        return { arguments: next, error: created }
      }
      const id = executedId(created)
      if (!id) {
        return {
          arguments: next,
          error: {
            ...created,
            ok: false,
            output: { code: 'RELATED_CREATE_MISSING_ID', message: 'Related create did not return an id.' },
          },
        }
      }
      options.createdIds.set(cacheKey, id)
      ids.push(id)
    }
    delete next[spec.displayKey]
    if (ids.length === 0) {
      delete next[spec.argKey]
      continue
    }
    if (relatedCardinality(spec) === 'many') {
      next[spec.argKey] = spec.itemIdKey
        ? ids.map((id) => ({ [spec.itemIdKey as string]: id }))
        : ids
    } else {
      next[spec.argKey] = ids[0]
    }
  }
  return { arguments: next }
}

export async function resolveRelatedForArgs(
  tool: Pick<ToolDefinition, 'relatedArgs' | 'jsonSchema'>,
  args: Record<string, unknown>,
  lookup: RelatedLookup,
): Promise<{
  arguments: Record<string, unknown>
  related: Array<{ spec: RelatedArg; record: Record<string, unknown> | null; missingHint: Record<string, unknown> | null }>
}> {
  const next = { ...args }
  const related: Array<{
    spec: RelatedArg
    record: Record<string, unknown> | null
    missingHint: Record<string, unknown> | null
  }> = []
  for (const spec of tool.relatedArgs ?? []) {
    const hints = collectHints(next, spec)
    const hint = relatedCardinality(spec) === 'many' ? hints[0] : (hints[0] ?? next[spec.displayKey] ?? next[spec.argKey])
    const displayed = next[spec.displayKey]
    const nested: Record<string, unknown> | null = isRecord(hint) ? hint : isRecord(displayed) ? displayed : null
    const raw = typeof next[spec.argKey] === 'string' ? next[spec.argKey] : hint
    const id = typeof raw === 'string' && looksLikeRecordId(raw) ? raw.trim() : undefined
    const parsed = parseRelatedNameHint(nested ?? (id ? null : raw))
    let record: Record<string, unknown> | null = hint != null ? await resolveHintRecord(spec, hint, lookup) : null
    if (record) {
      const recordId = typeof record.id === 'string' ? record.id : id
      if (recordId && relatedCardinality(spec) === 'one') {
        next[spec.argKey] = recordId
      }
      delete next[spec.displayKey]
      related.push({ spec, record, missingHint: null })
      continue
    }
    let missingHint: Record<string, unknown> | null = nested
    if (!missingHint && parsed) {
      missingHint = { name: parsed.name }
      if (parsed.symbol) {
        missingHint.symbol = parsed.symbol
      }
    }
    const parentName = typeof next.name === 'string' ? next.name.trim().toLowerCase() : ''
    const hintName = typeof missingHint?.name === 'string' ? missingHint.name.trim().toLowerCase() : ''
    if (parentName && hintName && parentName === hintName) {
      missingHint = null
    }
    if (typeof next[spec.argKey] === 'string' && !looksLikeRecordId(String(next[spec.argKey]))) {
      delete next[spec.argKey]
    }
    if (missingHint && relatedCardinality(spec) === 'one') {
      next[spec.displayKey] = missingHint
    } else {
      delete next[spec.displayKey]
    }
    related.push({ spec, record: missingHint, missingHint })
  }
  return { arguments: next, related }
}

export function missingRelatedCreates(
  resolved: Awaited<ReturnType<typeof resolveRelatedForArgs>>,
  getTool: (name: string) => ToolDefinition | undefined,
  role: ToolRole,
  existingNames: Set<string>,
): Array<{ name: string; arguments: Record<string, unknown> }> {
  const calls: Array<{ name: string; arguments: Record<string, unknown> }> = []
  const seen = new Set(existingNames)
  for (const item of resolved.related) {
    if (!item.missingHint) {
      continue
    }
    const createTool = getTool(item.spec.createTool)
    if (!createTool || createTool.riskLevel !== 'write') {
      continue
    }
    const args = relatedCreateArgs(createTool, item.missingHint, role)
    const missing = missingRequiredArgs(createTool.jsonSchema, args)
    const name = typeof args.name === 'string' ? args.name.trim().toLowerCase() : ''
    if (missing.length > 0 || !name || seen.has(`${createTool.name}:${name}`)) {
      continue
    }
    seen.add(`${createTool.name}:${name}`)
    calls.push({
      name: createTool.name,
      arguments: args,
    })
  }
  return calls
}

export function summaryForDisplay(args: Record<string, unknown>): string {
  return formatRecordLines(args)
}

export async function attachRelatedDisplay(
  writes: PendingWrite[],
  options: {
    getTool: (name: string) => ToolDefinition | undefined
    lookup: (
      tool: ToolDefinition,
      spec: RelatedArg,
      query: { id?: string; name?: string },
    ) => Promise<Record<string, unknown> | null>
    role: ToolRole
  },
): Promise<{ writes: PendingWrite[] }> {
  const nextWrites: PendingWrite[] = []
  for (const write of writes) {
    const tool = options.getTool(write.call.name)
    if (!tool?.relatedArgs?.length) {
      const displayArguments = displayCreateArguments(write.output.arguments, [])
      nextWrites.push({
        ...write,
        output: {
          ...write.output,
          displayArguments,
          relatedTree: [],
          summary: summaryForDisplay(displayArguments),
        },
      })
      continue
    }
    const relatedTree = await buildRelatedTree(tool, write.output.arguments, {
      getTool: options.getTool,
      lookup: (spec, query) => options.lookup(tool, spec, query),
      role: options.role,
    })
    const displayArguments = displayArgumentsFromTree(write.output.arguments, tool, relatedTree)
    nextWrites.push({
      call: write.call,
      output: {
        ...write.output,
        displayArguments,
        relatedTree,
        summary: summaryForDisplay(displayArguments),
      },
    })
  }
  return { writes: nextWrites }
}
