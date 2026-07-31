import type { SessionRole } from '@/features/session/types/sessionRole.types'

/** Company owner or staff (member + active company) can use company workspace features. */
export function canAccessCompanySession(
  role: SessionRole | null | undefined,
  companyId?: string | null,
): boolean {
  if (role === 'company_admin' || role === 'member') {
    return Boolean(companyId)
  }
  return false
}

/** Schedule/Events list pages — Default User (member, no company) and company sessions. */
export function canBrowseCalendar(role: SessionRole | null | undefined): boolean {
  return role === 'member' || role === 'company_admin'
}
