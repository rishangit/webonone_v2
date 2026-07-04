import { apiClient } from '@/shared/services/apiClient'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import type { AssumableRolesResponse } from '../types/sessionRole.types'
import type { UserProfile } from '@/features/auth/types/auth.types'

export const sessionRoleApi = {
  getAssumableRoles(): Promise<AssumableRolesResponse> {
    return apiClient<AssumableRolesResponse>('/company/me/assumable-roles')
  },

  async reissueSessionRole(
    accessToken: string,
    platformRole: 'super_admin' | 'company_admin' | 'member',
    companyId: string | null,
  ): Promise<{ accessToken: string; user: UserProfile }> {
    const res = await fetch(`${getIdentityApiBase()}/auth/session-role`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ platformRole, companyId }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message ?? `Failed to set session role (${res.status})`)
    }
    return res.json() as Promise<{ accessToken: string; user: UserProfile }>
  },
}
