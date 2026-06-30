import { apiClient } from '@/shared/services/apiClient'
import type { RootState } from '@/app/store'

export async function syncEmailRoleBeforeHandoff(
  getState?: () => RootState,
): Promise<void> {
  const sessionRole = getState?.().sessionRole
  const body =
    sessionRole?.activeRole != null
      ? {
          sessionRole: sessionRole.activeRole,
          companyId: sessionRole.activeCompanyId,
        }
      : undefined

  await apiClient('/company/me/sync-email-role', {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}
