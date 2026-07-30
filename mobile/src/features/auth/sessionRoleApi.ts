import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'

export type GatewaySessionRole = 'super_admin' | 'company_admin'

export type GatewayRoleOption = {
  role: GatewaySessionRole
  companyId: string | null
  label: string
  companyName: string | null
}

type AssumableRoleOption = {
  role: string
  companyId: string | null
  label: string
  companyName?: string
  accountKind?: string
}

type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
}

const webononeClient = createApiClient(env.webononeApiBaseUrl)
const identityClient = createApiClient(env.identityApiBaseUrl)

/** Keep Super Admin and Company Owner only — no member/staff for SMS gateway. */
export function filterGatewayRoles(roles: AssumableRoleOption[]): GatewayRoleOption[] {
  return roles
    .filter((r): r is AssumableRoleOption & { role: GatewaySessionRole } => {
      return r.role === 'super_admin' || r.role === 'company_admin'
    })
    .map((r) => ({
      role: r.role,
      companyId: r.companyId,
      label: r.role === 'super_admin' ? 'Super Admin' : (r.companyName ?? r.label),
      companyName: r.role === 'company_admin' ? (r.companyName ?? r.label) : null,
    }))
}

export function findMatchingGatewayRole(
  options: GatewayRoleOption[],
  role: GatewaySessionRole,
  companyId: string | null,
): GatewayRoleOption | undefined {
  return options.find(
    (o) => o.role === role && (o.companyId ?? null) === (companyId ?? null),
  )
}

export const sessionRoleApi = {
  async getAssumableRoles(accessToken: string): Promise<GatewayRoleOption[]> {
    const result = await webononeClient<AssumableRolesResponse>('/company/me/assumable-roles', {
      bearer: accessToken,
    })
    return filterGatewayRoles(result.roles ?? [])
  },

  async reissueSessionRole(
    accessToken: string,
    platformRole: GatewaySessionRole,
    companyId: string | null,
  ): Promise<{ accessToken: string }> {
    const result = await identityClient<{ accessToken: string }>('/auth/session-role', {
      method: 'POST',
      body: { platformRole, companyId },
      bearer: accessToken,
    })
    return { accessToken: result.accessToken }
  },
}
