import { apiClient } from '@/shared/services/apiClient'

export async function syncEmailRoleBeforeHandoff(): Promise<void> {
  await apiClient('/company/me/sync-email-role', { method: 'POST' })
}
