import { isAllowedInvokePath } from './invokePath.js'
import {
  isToolServiceId,
  SERVICE_KEY_HEADERS,
  type ArgCompletion,
  type ToolDefinition,
  type ToolRole,
  type ToolServiceId,
} from './registry.js'

type CapabilitiesResponse = {
  service?: string
  tools?: unknown
}

export type CapabilityPeer = {
  service: ToolServiceId
  apiBaseUrl: string
  serviceApiKey: string
}

const TOOL_ROLES: readonly ToolRole[] = ['super_admin', 'company_admin', 'member', 'guest']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isToolRole(value: unknown): value is ToolRole {
  return typeof value === 'string' && (TOOL_ROLES as readonly string[]).includes(value)
}

function parseArgCompletion(raw: unknown): ArgCompletion | undefined {
  if (!isRecord(raw)) {
    return undefined
  }
  const completion: ArgCompletion = {}
  if (Array.isArray(raw.allowedKeys)) {
    const allowedKeys = raw.allowedKeys.filter((key): key is string => typeof key === 'string')
    if (allowedKeys.length > 0) {
      completion.allowedKeys = allowedKeys
    }
  }
  if (isRecord(raw.defaults)) {
    completion.defaults = raw.defaults
  }
  if (isRecord(raw.forceByRole)) {
    const forceByRole: NonNullable<ArgCompletion['forceByRole']> = {}
    for (const [role, values] of Object.entries(raw.forceByRole)) {
      if (isToolRole(role) && isRecord(values)) {
        forceByRole[role] = values
      }
    }
    if (Object.keys(forceByRole).length > 0) {
      completion.forceByRole = forceByRole
    }
  }
  if (typeof raw.uniqueBy === 'string' && raw.uniqueBy.trim()) {
    completion.uniqueBy = raw.uniqueBy.trim()
  }
  if (isRecord(raw.uniqueLookup)) {
    const path = raw.uniqueLookup.path
    const method = raw.uniqueLookup.method
    const queryParam = raw.uniqueLookup.queryParam
    if (method === 'GET' && typeof path === 'string' && queryParam === 'names') {
      completion.uniqueLookup = { method: 'GET', path, queryParam: 'names' }
    }
  }
  if (Array.isArray(raw.pascalCaseKeys)) {
    const pascalCaseKeys = raw.pascalCaseKeys.filter(
      (key): key is string => typeof key === 'string' && key.trim().length > 0,
    )
    if (pascalCaseKeys.length > 0) {
      completion.pascalCaseKeys = pascalCaseKeys
    }
  }
  return completion.allowedKeys ||
    completion.defaults ||
    completion.forceByRole ||
    completion.uniqueBy ||
    completion.uniqueLookup ||
    completion.pascalCaseKeys
    ? completion
    : undefined
}

function parseViewPath(raw: unknown): string | undefined {
  if (typeof raw !== 'string') {
    return undefined
  }
  const path = raw.trim()
  if (!path.startsWith('/') || path.startsWith('//')) {
    return undefined
  }
  if (path.includes('..') || path.includes('\\') || path.includes('://')) {
    return undefined
  }
  return path
}

export function parseTool(raw: unknown): ToolDefinition | null {
  if (!isRecord(raw)) {
    return null
  }
  const invoke = raw.invoke
  if (!isRecord(invoke) || typeof invoke.method !== 'string' || typeof invoke.path !== 'string') {
    return null
  }
  const method = invoke.method.toUpperCase()
  if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    return null
  }
  if (typeof raw.name !== 'string' || typeof raw.description !== 'string') {
    return null
  }
  if (!isToolServiceId(raw.service)) {
    return null
  }
  if (raw.auth !== 'user_jwt' && raw.auth !== 'service_key') {
    return null
  }
  if (raw.riskLevel !== 'read' && raw.riskLevel !== 'write' && raw.riskLevel !== 'destructive') {
    return null
  }
  if (!Array.isArray(raw.requiredRoles) || !Array.isArray(raw.requiredPermissions)) {
    return null
  }
  if (!isAllowedInvokePath(raw.service, invoke.path)) {
    return null
  }
  const argCompletion = parseArgCompletion(raw.argCompletion)
  const viewPath = parseViewPath(raw.viewPath)
  return {
    name: raw.name,
    description: raw.description,
    jsonSchema: isRecord(raw.jsonSchema) ? raw.jsonSchema : { type: 'object', properties: {} },
    riskLevel: raw.riskLevel,
    requiredRoles: raw.requiredRoles.filter(
      (role): role is ToolDefinition['requiredRoles'][number] =>
        role === 'super_admin' || role === 'company_admin' || role === 'member' || role === 'guest',
    ),
    requiredPermissions: raw.requiredPermissions.filter((item): item is string => typeof item === 'string'),
    service: raw.service,
    auth: raw.auth,
    invoke: {
      method: method as ToolDefinition['invoke']['method'],
      path: invoke.path,
    },
    capabilityVersion: typeof raw.capabilityVersion === 'string' ? raw.capabilityVersion : '1',
    ...(argCompletion ? { argCompletion } : {}),
    ...(viewPath ? { viewPath } : {}),
  }
}

export async function discoverPeerCapabilities(
  peer: CapabilityPeer,
  options?: { timeoutMs?: number; fetchImpl?: typeof fetch },
): Promise<ToolDefinition[]> {
  const base = peer.apiBaseUrl.trim()
  const key = peer.serviceApiKey.trim()
  if (!base || !key) {
    return []
  }
  const origin = base.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options?.timeoutMs ?? 8_000)
  try {
    const fetchImpl = options?.fetchImpl ?? fetch
    const res = await fetchImpl(`${origin}/api/v1/internal/ai/capabilities`, {
      method: 'GET',
      headers: { [SERVICE_KEY_HEADERS[peer.service]]: key },
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error('[ai]', 'capability_discovery_http', peer.service, res.status)
      return []
    }
    const data = (await res.json().catch(() => ({}))) as CapabilitiesResponse
    const tools = Array.isArray(data.tools) ? data.tools : []
    return tools
      .map(parseTool)
      .filter((tool): tool is ToolDefinition => tool != null && tool.service === peer.service)
  } catch {
    console.error('[ai]', 'capability_discovery_failed', peer.service)
    return []
  } finally {
    clearTimeout(timer)
  }
}

export async function discoverAllCapabilities(
  peers: CapabilityPeer[],
  options?: { timeoutMs?: number; fetchImpl?: typeof fetch },
): Promise<ToolDefinition[]> {
  const batches = await Promise.all(peers.map((peer) => discoverPeerCapabilities(peer, options)))
  return batches.flat()
}
