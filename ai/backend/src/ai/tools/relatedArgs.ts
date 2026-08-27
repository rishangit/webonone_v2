import { coercePropertyValue, completeCreateArgs, missingRequiredArgs } from './createDefaults.js'
import {
  buildConfirmDisplayFields,
  displayRecordFromFields,
  isHiddenConfirmKey,
  type ConfirmDisplayField,
} from './confirmDisplay.js'
import { formatRecordLines } from './formatRecord.js'
import type { RelatedArg, RelatedNode, ToolDefinition, ToolResult, ToolRole } from './registry.js'
import type { PendingWrite } from './uniqueValues.js'

const RELATED_DEPTH = 3

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export { isHiddenConfirmKey } from './confirmDisplay.js'

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
  const hintedName = parsed?.name ?? relatedHintName(hint)
  if (hintedName) {
    seeded.name = hintedName
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

export function relatedHintName(hint: unknown): string | undefined {
  const nested = hintAsRecord(hint)
  const parsed = parseRelatedNameHint(nested.name ?? hint)
  if (parsed?.name) {
    return parsed.name
  }
  const direct = typeof nested.name === 'string' ? nested.name.trim() : ''
  if (direct && !looksLikeRecordId(direct)) {
    return direct
  }
  const description = typeof nested.description === 'string' ? nested.description.trim() : ''
  if (!description) {
    return undefined
  }
  const match = description.match(/^(.+?)\s+-\s+/)
  return match?.[1]?.trim() || undefined
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

export function argsHaveRelatedHints(
  tool: Pick<ToolDefinition, 'relatedArgs'>,
  args: Record<string, unknown>,
): boolean {
  for (const spec of tool.relatedArgs ?? []) {
    if (collectHints(args, spec).length > 0) {
      return true
    }
  }
  return false
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
  const names = new Set<string>()
  for (const name of [relatedHintName(hint), parseRelatedNameHint(hint)?.name, typeof nested?.name === 'string' ? nested.name.trim() : '']) {
    const trimmed = typeof name === 'string' ? name.trim() : ''
    if (!trimmed || looksLikeRecordId(trimmed)) {
      continue
    }
    names.add(trimmed)
    const compact = trimmed.replace(/\s+/g, '')
    if (compact) {
      names.add(compact)
    }
  }
  for (const name of names) {
    const record = await lookup(spec, { name })
    if (record) {
      return record
    }
  }
  return null
}

async function resolveNodeRecordId(
  spec: RelatedArg,
  node: RelatedNode,
  lookup?: RelatedLookup,
): Promise<string | null> {
  if (typeof node.recordId === 'string' && looksLikeRecordId(node.recordId)) {
    return node.recordId
  }
  const recordId = typeof node.record.id === 'string' ? node.record.id.trim() : ''
  if (recordId && looksLikeRecordId(recordId)) {
    return recordId
  }
  if (!lookup) {
    return null
  }
  const hint = node.createArgs ?? node.record
  const existing = await resolveHintRecord(spec, hint, lookup)
  return existing && typeof existing.id === 'string' ? existing.id : null
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
      const hintName = relatedHintName(hint) ?? parsed?.name ?? (typeof hintRecord.name === 'string' ? hintRecord.name.trim() : '')
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
        const createTool = options.getTool(spec.createTool)
        const displayFields = createTool
          ? buildConfirmDisplayFields(createTool, existing, { editable: false, role: options.role })
          : undefined
        nodes.push({
          path,
          displayKey: spec.displayKey,
          exists: true,
          selected: true,
          record: displayFields ? displayRecordFromFields(displayFields) : publicConfirmRecord(existing),
          displayFields,
          recordId: existing.id,
        })
        continue
      }
      const createTool = options.getTool(spec.createTool)
      if (!createTool || createTool.riskLevel !== 'write') {
        continue
      }
      const createArgs = relatedCreateArgs(createTool, hintRecord, options.role)
      const createdName = typeof createArgs.name === 'string' ? createArgs.name.trim() : ''
      if (!createdName && !hintName) {
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
      const displayFields = buildConfirmDisplayFields(createTool, createArgs, {
        editable: true,
        role: options.role,
      })
      nodes.push({
        path,
        displayKey: spec.displayKey,
        exists: false,
        selected: true,
        record: displayRecordFromFields(displayFields),
        displayFields,
        createTool: createTool.name,
        createArgs,
        children: children.length > 0 ? children : undefined,
      })
    }
  }
  return nodes
}

export function displayFieldsFromTool(
  tool: Pick<ToolDefinition, 'jsonSchema' | 'relatedArgs' | 'argCompletion'> & { name?: string },
  args: Record<string, unknown>,
  role?: ToolRole,
): ConfirmDisplayField[] {
  return buildConfirmDisplayFields(tool, args, { role })
}

export function displayArgumentsFromTree(
  args: Record<string, unknown>,
  tool: Pick<ToolDefinition, 'relatedArgs' | 'jsonSchema' | 'argCompletion'> & { name?: string },
  _tree: RelatedNode[],
  role?: ToolRole,
): Record<string, unknown> {
  const fields = buildConfirmDisplayFields(tool, args, {
    role,
    omitMissing: isUpdatePayload(args),
  })
  if (fields.length > 0) {
    return displayRecordFromFields(fields)
  }
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
  tool: Pick<ToolDefinition, 'jsonSchema' | 'relatedArgs' | 'argCompletion'> & { name?: string },
  args: Record<string, unknown>,
  related: Array<{ displayKey: string; record: Record<string, unknown> | null }>,
  role?: ToolRole,
): Record<string, unknown> {
  const hidden = new Set(related.map((item) => item.displayKey))
  const displayFields = buildConfirmDisplayFields(tool, args, { role }).filter(
    (field) => !hidden.has(field.key) && !hidden.has(field.label),
  )
  const next =
    displayFields.length > 0
      ? displayRecordFromFields(displayFields)
      : (() => {
          const legacy: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(args)) {
            if (isHiddenConfirmKey(key) || hidden.has(key)) {
              continue
            }
            legacy[key] = value
          }
          return legacy
        })()
  for (const item of related) {
    if (item.record && Object.keys(item.record).length > 0) {
      next[item.displayKey] = item.record
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
    displayFields: Array.isArray(raw.displayFields)
      ? raw.displayFields.filter(
          (field): field is ConfirmDisplayField =>
            isRecord(field) &&
            typeof field.key === 'string' &&
            typeof field.label === 'string' &&
            typeof field.value === 'string' &&
            typeof field.missing === 'boolean' &&
            typeof field.editable === 'boolean' &&
            (field.inputType === 'text' || field.inputType === 'number'),
        )
      : undefined,
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

function isDuplicateNameResult(result: ToolResult): boolean {
  if (!isRecord(result.output)) {
    return false
  }
  const code = result.output.code
  const message = result.output.message
  const status = result.output.status
  return (
    code === 'DUPLICATE_NAME' ||
    status === 409 ||
    (typeof message === 'string' && message.trim().toLowerCase() === 'name already exists')
  )
}

function specForDisplayKey(
  tool: Pick<ToolDefinition, 'relatedArgs'>,
  displayKey: string,
): RelatedArg | undefined {
  return (tool.relatedArgs ?? []).find((spec) => spec.displayKey === displayKey)
}

export async function refreshRelatedTree(
  tool: Pick<ToolDefinition, 'relatedArgs'>,
  tree: RelatedNode[],
  lookup: RelatedLookup,
  options?: {
    getTool?: (name: string) => ToolDefinition | undefined
    role?: ToolRole
  },
): Promise<RelatedNode[]> {
  async function refreshNode(node: RelatedNode): Promise<RelatedNode> {
    const children =
      node.children && node.children.length > 0
        ? await Promise.all(node.children.map((child) => refreshNode(child)))
        : undefined

    if (node.exists && node.recordId) {
      return { ...node, children }
    }

    const spec = specForDisplayKey(tool, node.displayKey)
    if (!spec) {
      return { ...node, children }
    }

    const hint = node.createArgs ?? node.record
    const existing = await resolveHintRecord(spec, hint, lookup)
    if (existing && typeof existing.id === 'string') {
      const createTool = options?.getTool?.(spec.createTool)
      const displayFields = createTool
        ? buildConfirmDisplayFields(createTool, existing, {
            editable: false,
            role: options?.role,
          })
        : undefined
      return {
        path: node.path,
        displayKey: node.displayKey,
        exists: true,
        selected: true,
        record: displayFields ? displayRecordFromFields(displayFields) : publicConfirmRecord(existing),
        displayFields,
        recordId: existing.id,
        children,
      }
    }

    return { ...node, children }
  }

  return Promise.all(tree.map((node) => refreshNode(node)))
}

export function applyRelatedArgumentOverrides(
  tree: RelatedNode[],
  overrides?: Record<string, Record<string, unknown>>,
): RelatedNode[] {
  if (!overrides) {
    return tree
  }
  return tree.map((node) => {
    const nodeOverrides = overrides[node.path]
    const createArgs =
      node.createArgs && nodeOverrides ? { ...node.createArgs, ...nodeOverrides } : node.createArgs
    return {
      ...node,
      createArgs,
      children: node.children ? applyRelatedArgumentOverrides(node.children, overrides) : undefined,
    }
  })
}

export async function materializeRelatedTree(
  tool: Pick<ToolDefinition, 'relatedArgs'>,
  args: Record<string, unknown>,
  tree: RelatedNode[],
  options: {
    getTool: (name: string) => ToolDefinition | undefined
    execute: (call: { name: string; arguments: Record<string, unknown> }) => Promise<ToolResult>
    createdIds: Map<string, string>
    lookup?: RelatedLookup
  },
): Promise<{ arguments: Record<string, unknown>; error?: ToolResult }> {
  const next = { ...args }
  for (const spec of tool.relatedArgs ?? []) {
    const specNodes = tree.filter((node) => node.displayKey === spec.displayKey && nodeIsIncluded(node))
    const ids: string[] = []
    for (const node of specNodes) {
      const resolvedId = await resolveNodeRecordId(spec, node, options.lookup)
      if (resolvedId) {
        ids.push(resolvedId)
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
        if (isDuplicateNameResult(created) && options.lookup) {
          const spec = specForDisplayKey(tool, node.displayKey)
          const hint = node.createArgs ?? node.record
          if (spec) {
            const existing = await resolveHintRecord(spec, hint, options.lookup)
            const existingId = existing && typeof existing.id === 'string' ? existing.id : null
            if (existingId) {
              options.createdIds.set(cacheKey, existingId)
              ids.push(existingId)
              continue
            }
          }
        }
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

export async function ensureWritableCatalogUpdateArgs(
  tool: Pick<ToolDefinition, 'relatedArgs'>,
  args: Record<string, unknown>,
  tree: RelatedNode[],
  lookup?: RelatedLookup,
): Promise<Record<string, unknown>> {
  if (hasWritableUpdatePayload(args) || !tool.relatedArgs?.length) {
    return args
  }
  const next = { ...args }
  for (const spec of tool.relatedArgs ?? []) {
    if (next[spec.argKey] !== undefined) {
      continue
    }
    const ids: string[] = []
    for (const node of tree.filter((entry) => entry.displayKey === spec.displayKey && nodeIsIncluded(entry))) {
      const resolvedId = await resolveNodeRecordId(spec, node, lookup)
      if (resolvedId) {
        ids.push(resolvedId)
      }
    }
    if (ids.length === 0) {
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
  return next
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

export function summaryFromRelatedTree(tree: RelatedNode[]): string {
  const lines: string[] = []
  for (const node of tree) {
    const name = typeof node.record.name === 'string' ? node.record.name.trim() : ''
    const symbol = typeof node.record.symbol === 'string' ? node.record.symbol.trim() : ''
    const label = name ? (symbol ? `${name} (${symbol})` : name) : node.displayKey
    lines.push(`${node.displayKey}: ${label}`)
  }
  return lines.join('\n')
}

export function hasWritableUpdatePayload(args: Record<string, unknown>): boolean {
  return Object.entries(args).some(([key, value]) => {
    if (key === 'id') {
      return false
    }
    if (value === undefined || value === null || value === '') {
      return false
    }
    if (Array.isArray(value) && value.length === 0) {
      return false
    }
    return true
  })
}

function parentLabelFromArgs(args: Record<string, unknown>): string | undefined {
  const name = typeof args.name === 'string' ? args.name.trim() : ''
  return name || undefined
}

function isUpdatePayload(args: Record<string, unknown>): boolean {
  return typeof args.id === 'string' && args.id.trim().length > 0
}

export async function buildParentDisplayFields(
  tool: Pick<ToolDefinition, 'name' | 'jsonSchema' | 'relatedArgs' | 'argCompletion'>,
  args: Record<string, unknown>,
  role: ToolRole,
  lookupRecordById?: (tool: ToolDefinition, id: string) => Promise<Record<string, unknown> | null>,
): Promise<ConfirmDisplayField[]> {
  if (!isUpdatePayload(args)) {
    return buildConfirmDisplayFields(tool, args, { role })
  }
  let fields = buildConfirmDisplayFields(tool, args, { role, omitMissing: true })
  if (fields.length === 0 && lookupRecordById && typeof args.id === 'string') {
    const record = await lookupRecordById(tool as ToolDefinition, args.id)
    const name = typeof record?.name === 'string' ? record.name.trim() : ''
    if (name) {
      fields = [
        {
          key: 'name',
          label: 'Name',
          value: name,
          missing: false,
          editable: false,
          inputType: 'text',
        },
      ]
    }
  }
  return fields
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
    lookupRecordById?: (
      tool: ToolDefinition,
      id: string,
    ) => Promise<Record<string, unknown> | null>
    role: ToolRole
  },
): Promise<{ writes: PendingWrite[] }> {
  const nextWrites: PendingWrite[] = []
  for (const write of writes) {
    const tool = options.getTool(write.call.name)
    if (!tool) {
      nextWrites.push(write)
      continue
    }
    if (!tool.relatedArgs?.length) {
      const displayFields = await buildParentDisplayFields(
        tool,
        write.output.arguments,
        options.role,
        options.lookupRecordById,
      )
      const displayArguments =
        displayFields.length > 0
          ? displayRecordFromFields(displayFields)
          : displayCreateArguments(tool, write.output.arguments, [])
      nextWrites.push({
        ...write,
        output: {
          ...write.output,
          displayArguments,
          displayFields: displayFields.length > 0 ? displayFields : undefined,
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
    let displayArguments = displayArgumentsFromTree(write.output.arguments, tool, relatedTree, options.role)
    const displayFields = await buildParentDisplayFields(
      tool,
      write.output.arguments,
      options.role,
      options.lookupRecordById,
    )
    if (Object.keys(displayArguments).length === 0) {
      const parentName = parentLabelFromArgs(write.output.arguments)
      if (parentName) {
        displayArguments = { name: parentName }
      } else if (typeof write.output.arguments.id === 'string' && options.lookupRecordById) {
        const record = await options.lookupRecordById(tool, write.output.arguments.id)
        const recordName = typeof record?.name === 'string' ? record.name.trim() : ''
        if (recordName) {
          displayArguments = { name: recordName }
        }
      }
    }
    let summary = summaryForDisplay(displayArguments)
    if (!summary.trim() && relatedTree.length > 0) {
      summary = summaryFromRelatedTree(relatedTree)
    }
    nextWrites.push({
      call: write.call,
      output: {
        ...write.output,
        displayArguments,
        displayFields: displayFields.length > 0 ? displayFields : undefined,
        relatedTree,
        summary: summary || summaryForDisplay(write.output.arguments),
      },
    })
  }
  return { writes: nextWrites }
}
