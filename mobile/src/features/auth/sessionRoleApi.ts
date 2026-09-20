import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { DataEntityKey } from '@webonone/platform-nav'
import type { SessionRole } from '@/shared/types'

export type SessionRoleOption = {
  role: SessionRole
  companyId: string | null
  label: string
  companyName: string | null
  companyLogoUrl?: string | null
  accountKind?: 'staff'
  dataEntities?: DataEntityKey[]
}

type AssumableRoleOption = {
  role: string
  companyId: string | null
  label: string
  companyName?: string
  companyLogoUrl?: string | null
  accountKind?: 'staff'
  dataEntities?: DataEntityKey[]
}

type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
}

const webononeClient = createApiClient(env.webononeApiBaseUrl)
const identityClient = createApiClient(env.identityApiBaseUrl)

function isSessionRole(value: string): value is SessionRole {
  return value === 'super_admin' || value === 'company_admin' || value === 'member'
}

export function mapAssumableRoles(roles: AssumableRoleOption[]): SessionRoleOption[] {
  return roles
    .filter((r): r is AssumableRoleOption & { role: SessionRole } => isSessionRole(r.role))
    .map((r) => ({
      role: r.role,
      companyId: r.companyId,
      label: r.label,
      companyName: r.companyName ?? (r.role === 'company_admin' || r.role === 'member' ? r.label : null),
      companyLogoUrl: r.companyLogoUrl ?? null,
      accountKind: r.accountKind,
      dataEntities: r.dataEntities,
    }))
}

export function findMatchingSessionRole(
  options: SessionRoleOption[],
  role: SessionRole,
  companyId: string | null,
): SessionRoleOption | undefined {
  return options.find((o) => o.role === role && (o.companyId ?? null) === (companyId ?? null))
}

export const sessionRoleApi = {
  async getAssumableRoles(accessToken: string): Promise<SessionRoleOption[]> {
    const result = await webononeClient<AssumableRolesResponse>('/company/me/assumable-roles', {
      bearer: accessToken,
    })
    return mapAssumableRoles(result.roles ?? [])
  },

  async reissueSessionRole(
    accessToken: string,
    platformRole: SessionRole,
    companyId: string | null,
  ): Promise<{ accessToken: string }> {
    const result = await identityClient<{ accessToken: string }>('/auth/session-role', {
      method: 'POST',
      body: { platformRole, companyId },
      bearer: accessToken,
    })
    return { accessToken: result.accessToken }
  },

  async patchLocale(accessToken: string, locale: 'en' | 'si'): Promise<void> {
    await identityClient('/auth/me', {
      method: 'PATCH',
      body: { locale },
      bearer: accessToken,
    })
  },
}
