import { apiClient } from '@/shared/services/apiClient'
import type { RootState } from '@/app/store'

export async function syncDataRoleBeforeHandoff(
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

  await apiClient('/company/me/sync-data-role', {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
}
