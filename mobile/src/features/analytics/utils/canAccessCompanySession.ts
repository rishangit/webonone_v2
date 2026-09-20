import type { SessionRole } from '@/shared/types'

export function canAccessCompanySession(
  role: SessionRole | null | undefined,
  companyId?: string | null,
): boolean {
  if (role === 'company_admin' || role === 'member') {
    return Boolean(companyId)
  }
  return false
}
