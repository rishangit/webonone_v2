import { isToolServiceId, type ToolServiceId } from './registry.js'

const KIND_VALUES = new Set(['tags', 'units', 'attributes', 'products', 'services', 'spaces'])

const FORBIDDEN_ARG_KEYS = new Set([
  'company_id',
  'companyId',
  'guest_id',
  'guestId',
  'accessToken',
  'authorization',
  'token',
  'bearer',
])

function isSafeApiPath(path: string): boolean {
  return (
    path.startsWith('/api/v1/') &&
    !path.includes('..') &&
    !path.includes('\\') &&
    !path.includes('://') &&
    !path.includes('//', 1)
  )
}

const SERVICE_PATH_ALLOWED: Record<ToolServiceId, (path: string) => boolean> = {
  webonone: (path) =>
    /^\/api\/v1\/internal\/catalog(\/|$)/.test(path) ||
    /^\/api\/v1\/company\/me(\/|$)/.test(path) ||
    /^\/api\/v1\/company\/events(\/|$)/.test(path) ||
    /^\/api\/v1\/company\/staff(\/|$)/.test(path) ||
    /^\/api\/v1\/company\/admin(\/|$)/.test(path) ||
    path === '/api/v1/company/:companyId',
  data: (path) =>
    /^\/api\/v1\/(tags|units|attributes|products|services|spaces)(\/:id)?$/.test(path),
  email: () => false,
  sms: () => false,
  payment: () => false,
  design: () => false,
}

export function isAllowedInvokePath(service: string, path: string): boolean {
  if (!isToolServiceId(service) || !isSafeApiPath(path)) {
    return false
  }
  return SERVICE_PATH_ALLOWED[service](path)
}

export function stripIdentityArgs(args: Record<string, unknown>): Record<string, unknown> {
  const remaining: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(args)) {
    if (!FORBIDDEN_ARG_KEYS.has(key)) {
      remaining[key] = value
    }
  }
  return remaining
}

export function peerApiOrigin(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

export function buildInvokeRequest(
  pathTemplate: string,
  args: Record<string, unknown>,
  companyId: string | null,
): { path: string; remaining: Record<string, unknown> } {
  const remaining = stripIdentityArgs(args)
  const path = pathTemplate.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, (_match, name: string) => {
    if (name === 'companyId') {
      if (!companyId || !/^[A-Za-z0-9_-]{8,32}$/.test(companyId)) {
        throw new Error('company_session_required')
      }
      return encodeURIComponent(companyId)
    }
    const value = remaining[name]
    delete remaining[name]
    if (name === 'kind') {
      if (typeof value !== 'string' || !KIND_VALUES.has(value)) {
        throw new Error('invalid_kind')
      }
      return value
    }
    if (name === 'id') {
      if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{8,32}$/.test(value)) {
        throw new Error('invalid_id')
      }
      return encodeURIComponent(value)
    }
    throw new Error(`unsupported_path_param:${name}`)
  })
  return { path, remaining }
}

export function toQueryString(remaining: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(remaining)) {
    if (value == null || value === '') {
      continue
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params.set(key, String(value))
    }
  }
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ''
}
