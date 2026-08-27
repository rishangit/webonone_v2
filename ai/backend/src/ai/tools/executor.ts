import { completeCreateArgs, missingConditionalArgs, missingRequiredArgs } from './createDefaults.js'
import { formatRecordLines } from './formatRecord.js'
import type { AiRequestContext } from '../requestContext.js'
import {
  buildInvokeRequest,
  isAllowedInvokePath,
  peerApiOrigin,
  toQueryString,
} from './invokePath.js'
import {
  applyRelatedArgumentOverrides,
  applyRelatedSelections,
  argsHaveRelatedHints,
  buildRelatedTree,
  ensureWritableCatalogUpdateArgs,
  hasWritableUpdatePayload,
  looksLikeRecordId,
  materializeRelatedTree,
  refreshRelatedTree,
  schemaPropertyArgs,
} from './relatedArgs.js'
import {
  SERVICE_KEY_HEADERS,
  type RelatedArg,
  type RelatedNode,
  type ToolCall,
  type ToolDefinition,
  type ToolExecutor,
  type ToolRegistry,
  type ToolResult,
  type ToolServiceId,
} from './registry.js'

export type ExecutorPeer = {
  apiBaseUrl: string
  serviceApiKey: string
}

export type ExecutorContext = Pick<
  AiRequestContext,
  'role' | 'permissions' | 'companyId' | 'accessToken'
>

function summaryFor(args: Record<string, unknown>): string {
  return formatRecordLines(args)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function peerErrorMessage(body: unknown): string {
  const record = isRecord(body) ? body : {}
  const message = typeof record.message === 'string' && record.message.trim() ? record.message : 'Request failed'
  const details = isRecord(record.details) ? record.details : null
  const fieldErrors = details && isRecord(details.fieldErrors) ? details.fieldErrors : null
  if (!fieldErrors) {
    return message
  }
  const parts: string[] = []
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    const text = Array.isArray(msgs) ? msgs.filter((item) => typeof item === 'string').join(', ') : ''
    if (text) {
      parts.push(`${key}: ${text}`)
    }
  }
  return parts.length > 0 ? `${message} (${parts.join('; ')})` : message
}

function canUseTool(tool: ToolDefinition, ctx: ExecutorContext): boolean {
  if (!tool.requiredRoles.includes(ctx.role)) {
    return false
  }
  const allowed = new Set<string>(ctx.permissions)
  return tool.requiredPermissions.every((permission) => allowed.has(permission))
}

const CATALOG_UPDATE_GET_TOOL: Record<string, string> = {
  update_data_product: 'get_data_product',
  update_data_service: 'get_data_service',
  update_data_space: 'get_data_space',
}

function isCatalogUpdateTool(name: string): boolean {
  return name in CATALOG_UPDATE_GET_TOOL
}

function idFromRelationItem(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  if (!isRecord(value)) {
    return null
  }
  if (typeof value.id === 'string' && value.id.trim()) {
    return value.id.trim()
  }
  if (typeof value.attribute_id === 'string' && value.attribute_id.trim()) {
    return value.attribute_id.trim()
  }
  if (typeof value.tag_id === 'string' && value.tag_id.trim()) {
    return value.tag_id.trim()
  }
  return null
}

function mergeTagIds(existing: unknown[], incoming: unknown): string[] {
  const ids = new Set<string>()
  for (const item of existing) {
    const id = idFromRelationItem(item)
    if (id) {
      ids.add(id)
    }
  }
  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      const id = idFromRelationItem(item)
      if (id) {
        ids.add(id)
      }
    }
  }
  return [...ids]
}

function mergeAttributeLinks(existing: unknown[], incoming: unknown): Array<{ attribute_id: string }> {
  const ids = new Set<string>()
  for (const item of existing) {
    const id = idFromRelationItem(item)
    if (id) {
      ids.add(id)
    }
  }
  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      const id = idFromRelationItem(item)
      if (id) {
        ids.add(id)
      }
    }
  }
  return [...ids].map((attribute_id) => ({ attribute_id }))
}

export class HttpToolExecutor implements ToolExecutor {
  constructor(
    private readonly options: {
      registry: ToolRegistry
      peers: Partial<Record<ToolServiceId, ExecutorPeer>>
      timeoutMs: number
      fetchImpl?: typeof fetch
    },
  ) {}

  async execute(
    call: ToolCall,
    ctx: ExecutorContext,
    options?: {
      confirmed?: boolean
      relatedTree?: RelatedNode[]
      relatedSelections?: Record<string, boolean>
      argumentOverrides?: Record<string, unknown>
      relatedArgumentOverrides?: Record<string, Record<string, unknown>>
      skipRelated?: boolean
    },
  ): Promise<ToolResult> {
    const tool = this.options.registry.get(call.name)
    if (!tool) {
      return { toolCallId: call.id, name: call.name, ok: false, output: { code: 'UNKNOWN_TOOL' } }
    }
    if (!canUseTool(tool, ctx)) {
      return { toolCallId: call.id, name: call.name, ok: false, output: { code: 'FORBIDDEN' } }
    }
    if (!isAllowedInvokePath(tool.service, tool.invoke.path)) {
      return { toolCallId: call.id, name: call.name, ok: false, output: { code: 'INVOKE_NOT_ALLOWED' } }
    }

    const mergedRaw = {
      ...(call.arguments && typeof call.arguments === 'object' ? call.arguments : {}),
      ...(options?.argumentOverrides ?? {}),
    }
    let args = completeCreateArgs(tool, mergedRaw, ctx.role)
    const shouldResolveRelated =
      Boolean(options?.confirmed && tool.relatedArgs && tool.relatedArgs.length > 0 && !options?.skipRelated)
    if (shouldResolveRelated && tool.relatedArgs) {
      const lookup = (spec: RelatedArg, query: { id?: string; name?: string }) =>
        this.lookupRelatedRecord(tool, spec, ctx, query)
      let tree = options?.relatedTree
      if (!tree || tree.length === 0) {
        if (argsHaveRelatedHints(tool, args)) {
          tree = await buildRelatedTree(tool, args, {
            getTool: (name) => this.options.registry.get(name),
            lookup,
            role: ctx.role,
          })
        } else {
          tree = []
        }
      } else {
        tree = await refreshRelatedTree(tool, tree, lookup, {
          getTool: (name) => this.options.registry.get(name),
          role: ctx.role,
        })
      }
      const selected = applyRelatedSelections(
        applyRelatedArgumentOverrides(tree, options?.relatedArgumentOverrides),
        options?.relatedSelections,
      )
      const materialized = await materializeRelatedTree(tool, args, selected, {
        getTool: (name) => this.options.registry.get(name),
        createdIds: new Map(),
        lookup,
        execute: (nested) =>
          this.execute(
            { id: `${call.id}:${nested.name}`, name: nested.name, arguments: nested.arguments },
            ctx,
            { confirmed: true, skipRelated: true },
          ),
      })
      if (materialized.error) {
        return { ...materialized.error, toolCallId: call.id, name: call.name }
      }
      args = schemaPropertyArgs(tool.jsonSchema, materialized.arguments)
      for (const spec of tool.relatedArgs) {
        const value = args[spec.argKey]
        if (typeof value === 'string' && !looksLikeRecordId(value)) {
          delete args[spec.argKey]
        }
      }
      args = await ensureWritableCatalogUpdateArgs(tool, args, selected, lookup)
    } else if (options?.confirmed && Object.keys(schemaPropertyArgs(tool.jsonSchema, args)).length > 0) {
      args = schemaPropertyArgs(tool.jsonSchema, args)
    }
    if (options?.confirmed && isCatalogUpdateTool(tool.name) && typeof args.id === 'string') {
      args = await this.mergeCatalogUpdateRelations(tool, args, ctx)
    }
    const missing = [
      ...missingRequiredArgs(tool.jsonSchema, args),
      ...(options?.confirmed ? missingConditionalArgs(tool.jsonSchema, args) : []),
    ]
    if (missing.length > 0) {
      return {
        toolCallId: call.id,
        name: call.name,
        ok: false,
        output: {
          code: 'MISSING_REQUIRED_ARGS',
          missing,
          arguments: args,
          message: `Fill required properties in the tool arguments before calling ${tool.name}: ${missing.join(', ')}. Copy user-given names from the message; suggest remaining descriptive fields.`,
        },
      }
    }
    if (
      (tool.invoke.method === 'PATCH' || tool.invoke.method === 'PUT') &&
      typeof args.id === 'string' &&
      !hasWritableUpdatePayload(args)
    ) {
      return {
        toolCallId: call.id,
        name: call.name,
        ok: false,
        output: {
          code: 'MISSING_REQUIRED_ARGS',
          missing: ['update fields'],
          arguments: args,
          message: `Include the fields to update on ${tool.name}, not only id. For related items put names in the related display fields (for example unit name and symbol).`,
        },
      }
    }
    if ((tool.riskLevel === 'write' || tool.riskLevel === 'destructive') && !options?.confirmed) {
      return {
        toolCallId: call.id,
        name: call.name,
        ok: true,
        output: {
          status: 'pending_confirmation',
          name: tool.name,
          riskLevel: tool.riskLevel,
          arguments: args,
          summary: summaryFor(args),
        },
      }
    }

    try {
      const peer = this.options.peers[tool.service]
      const origin = peer ? peerApiOrigin(peer.apiBaseUrl) : ''
      if (!peer || !origin) {
        return { toolCallId: call.id, name: call.name, ok: false, output: { code: 'PEER_NOT_CONFIGURED' } }
      }
      const built = buildInvokeRequest(tool.invoke.path, args, ctx.companyId)
      const isGetOrDelete = tool.invoke.method === 'GET' || tool.invoke.method === 'DELETE'
      const query = isGetOrDelete ? toQueryString(built.remaining) : ''
      const url = `${origin}${built.path}${query}`
      const headers: Record<string, string> = {}
      if (tool.auth === 'service_key') {
        if (!peer.serviceApiKey) {
          return { toolCallId: call.id, name: call.name, ok: false, output: { code: 'PEER_NOT_CONFIGURED' } }
        }
        headers[SERVICE_KEY_HEADERS[tool.service]] = peer.serviceApiKey
      } else {
        if (!ctx.accessToken || ctx.role === 'guest') {
          return { toolCallId: call.id, name: call.name, ok: false, output: { code: 'FORBIDDEN' } }
        }
        headers.Authorization = `Bearer ${ctx.accessToken}`
      }
      if (!isGetOrDelete) {
        headers['Content-Type'] = 'application/json'
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.options.timeoutMs)
      try {
        const fetchImpl = this.options.fetchImpl ?? fetch
        const res = await fetchImpl(url, {
          method: tool.invoke.method,
          headers,
          body: isGetOrDelete ? undefined : JSON.stringify(built.remaining),
          signal: controller.signal,
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          const duplicateName =
            res.status === 409 &&
            (body.code === 'DUPLICATE_NAME' ||
              (typeof body.message === 'string' &&
                body.message.trim().toLowerCase() === 'name already exists'))
          if (duplicateName && tool.argCompletion?.uniqueLookup) {
            const uniqueBy = tool.argCompletion.uniqueBy ?? 'name'
            const uniqueValue = args[uniqueBy]
            if (typeof uniqueValue === 'string' && uniqueValue.trim()) {
              const existingNames = await this.lookupExistingUniqueValues(tool, ctx, [uniqueValue])
              if (
                existingNames.some(
                  (name) => name.trim().toLowerCase() === uniqueValue.trim().toLowerCase(),
                )
              ) {
                return {
                  toolCallId: call.id,
                  name: call.name,
                  ok: true,
                  output: {
                    status: 'skipped_exists',
                    message: 'Name already exists',
                    name: uniqueValue,
                  },
                }
              }
            }
          }
          return {
            toolCallId: call.id,
            name: call.name,
            ok: false,
            output: {
              code: typeof body.code === 'string' ? body.code : 'PEER_HTTP_ERROR',
              status: res.status,
              message: peerErrorMessage(body),
            },
          }
        }
        return {
          toolCallId: call.id,
          name: call.name,
          ok: true,
          output: { status: 'executed', data: body },
        }
      } finally {
        clearTimeout(timer)
      }
    } catch (err) {
      const code =
        err instanceof Error && err.message.startsWith('invalid_') ? err.message.toUpperCase() : 'TOOL_HTTP_FAILED'
      return { toolCallId: call.id, name: call.name, ok: false, output: { code } }
    }
  }

  async lookupExistingUniqueValues(
    tool: ToolDefinition,
    ctx: ExecutorContext,
    values: string[],
  ): Promise<string[]> {
    const lookup = tool.argCompletion?.uniqueLookup
    const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 100)
    if (!lookup || lookup.method !== 'GET' || lookup.queryParam !== 'names' || unique.length === 0) {
      return []
    }
    if (!isAllowedInvokePath(tool.service, lookup.path)) {
      return []
    }
    const peer = this.options.peers[tool.service]
    const origin = peer ? peerApiOrigin(peer.apiBaseUrl) : ''
    if (!peer || !origin) {
      return []
    }
    if (!ctx.accessToken || ctx.role === 'guest') {
      return []
    }
    const query = toQueryString({ names: unique.join(',') })
    const url = `${origin}${lookup.path}${query}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs)
    try {
      const fetchImpl = this.options.fetchImpl ?? fetch
      const res = await fetchImpl(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${ctx.accessToken}` },
        signal: controller.signal,
      })
      if (!res.ok) {
        return []
      }
      const body = (await res.json().catch(() => ({}))) as { items?: unknown }
      if (!Array.isArray(body.items)) {
        return []
      }
      const names: string[] = []
      for (const item of body.items) {
        if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string' && item.name.trim()) {
          names.push(item.name)
        }
      }
      return names
    } catch {
      return []
    } finally {
      clearTimeout(timer)
    }
  }

  async lookupRelatedRecord(
    tool: ToolDefinition,
    spec: RelatedArg,
    ctx: ExecutorContext,
    query: { id?: string; name?: string },
  ): Promise<Record<string, unknown> | null> {
    if (!ctx.accessToken || ctx.role === 'guest') {
      return null
    }
    if (query.id && isAllowedInvokePath(tool.service, spec.getPath)) {
      const record = await this.peerJson(tool, spec.getPath, { id: query.id }, ctx)
      if (record && typeof record === 'object' && !Array.isArray(record) && typeof record.id === 'string') {
        return record
      }
    }
    const name = query.name?.trim()
    if (!name || !isAllowedInvokePath(tool.service, spec.listPath)) {
      return null
    }
    const body = await this.peerJson(tool, spec.listPath, { names: name }, ctx)
    const items = body && typeof body === 'object' && Array.isArray(body.items) ? body.items : []
    const match = items.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        'name' in item &&
        typeof item.name === 'string' &&
        item.name.trim().toLowerCase() === name.toLowerCase(),
    )
    return match && typeof match === 'object' ? (match as Record<string, unknown>) : null
  }

  private async mergeCatalogUpdateRelations(
    tool: ToolDefinition,
    args: Record<string, unknown>,
    ctx: ExecutorContext,
  ): Promise<Record<string, unknown>> {
    const getToolName = CATALOG_UPDATE_GET_TOOL[tool.name]
    if (!getToolName || typeof args.id !== 'string') {
      return args
    }
    const getTool = this.options.registry.get(getToolName)
    if (!getTool) {
      return args
    }
    const current = await this.peerJson(getTool, getTool.invoke.path, { id: args.id }, ctx)
    if (!current) {
      return args
    }

    const next = { ...args }
    if (args.tag_ids !== undefined) {
      const existingTags = Array.isArray(current.tags) ? current.tags : []
      next.tag_ids = mergeTagIds(existingTags, args.tag_ids)
    }
    if (args.attributes !== undefined) {
      const existingAttributes = Array.isArray(current.attributes) ? current.attributes : []
      next.attributes = mergeAttributeLinks(existingAttributes, args.attributes)
    }
    return next
  }

  private async peerJson(
    tool: ToolDefinition,
    pathTemplate: string,
    args: Record<string, unknown>,
    ctx: ExecutorContext,
  ): Promise<Record<string, unknown> | null> {
    const peer = this.options.peers[tool.service]
    const origin = peer ? peerApiOrigin(peer.apiBaseUrl) : ''
    if (!peer || !origin || !ctx.accessToken) {
      return null
    }
    try {
      const built = buildInvokeRequest(pathTemplate, args, ctx.companyId)
      const query = toQueryString(built.remaining)
      const url = `${origin}${built.path}${query}`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.options.timeoutMs)
      try {
        const fetchImpl = this.options.fetchImpl ?? fetch
        const res = await fetchImpl(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${ctx.accessToken}` },
          signal: controller.signal,
        })
        if (!res.ok) {
          return null
        }
        const body = (await res.json().catch(() => null)) as unknown
        return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
      } finally {
        clearTimeout(timer)
      }
    } catch {
      return null
    }
  }
}
