import type { AiRequestContext } from '../requestContext.js'
import type { ToolDefinition } from './registry.js'

const COMPANY_SESSION_EXEMPT_PATHS = new Set([
  '/api/v1/company/register',
  '/api/v1/company/me/companies',
  '/api/v1/company/discover',
  '/api/v1/company/discover/:companyId',
  '/api/v1/company/:id',
  '/api/v1/company/:id/connect',
])

function isCompanySessionExempt(path: string): boolean {
  return COMPANY_SESSION_EXEMPT_PATHS.has(path)
}

export function toolRequiresCompanySession(tool: ToolDefinition): boolean {
  const path = tool.invoke.path
  if (isCompanySessionExempt(path)) {
    return false
  }
  return (
    /\/company\/me(\/|$)/.test(path) ||
    /\/company\/events(\/|$)/.test(path) ||
    /\/company\/staff(\/|$)/.test(path) ||
    path.includes(':companyId')
  )
}

export function filterToolsForContext(
  tools: ToolDefinition[],
  ctx: Pick<AiRequestContext, 'role' | 'permissions' | 'companyId'>,
): ToolDefinition[] {
  return tools.filter((tool) => {
    if (!tool.requiredRoles.includes(ctx.role)) {
      return false
    }
    const allowed = new Set<string>(ctx.permissions)
    if (tool.requiredPermissions.some((permission) => !allowed.has(permission))) {
      return false
    }
    if (tool.auth === 'user_jwt' && !ctx.companyId && toolRequiresCompanySession(tool)) {
      return false
    }
    return true
  })
}
