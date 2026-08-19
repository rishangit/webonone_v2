import { completeCreateArgs, missingRequiredArgs } from './createDefaults.js'
import { formatRecordLines } from './formatRecord.js'
import type { AiRequestContext } from '../requestContext.js'
import {
  buildInvokeRequest,
  isAllowedInvokePath,
  peerApiOrigin,
  toQueryString,
} from './invokePath.js'
import {
  applyRelatedSelections,
  buildRelatedTree,
  looksLikeRecordId,
  materializeRelatedTree,
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

    const rawArgs = call.arguments && typeof call.arguments === 'object' ? call.arguments : {}
    let args = completeCreateArgs(tool, rawArgs, ctx.role)
    const shouldResolveRelated =
      Boolean(options?.confirmed && tool.relatedArgs && tool.relatedArgs.length > 0) &&
      (options?.relatedTree === undefined || options.relatedTree.length > 0)
    if (shouldResolveRelated && tool.relatedArgs) {
      const lookup = (spec: RelatedArg, query: { id?: string; name?: string }) =>
        this.lookupRelatedRecord(tool, spec, ctx, query)
      const tree =
        options?.relatedTree ??
        (await buildRelatedTree(tool, args, {
          getTool: (name) => this.options.registry.get(name),
          lookup,
          role: ctx.role,
        }))
      const selected = applyRelatedSelections(tree, options?.relatedSelections)
      const materialized = await materializeRelatedTree(tool, args, selected, {
        getTool: (name) => this.options.registry.get(name),
        createdIds: new Map(),
        execute: (nested) =>
          this.execute(
            { id: `${call.id}:${nested.name}`, name: nested.name, arguments: nested.arguments },
            ctx,
            { confirmed: true, relatedTree: [] },
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
    } else if (options?.confirmed && Object.keys(schemaPropertyArgs(tool.jsonSchema, args)).length > 0) {
      args = schemaPropertyArgs(tool.jsonSchema, args)
    }
    const missing = missingRequiredArgs(tool.jsonSchema, args)
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
