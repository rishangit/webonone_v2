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

export function canChangeSession(
  role: SessionRole | null | undefined,
  companyId?: string | null,
  isAssignedStaff?: boolean,
): boolean {
  if (!companyId) return false
  if (role === 'company_admin') return true
  if (role === 'member' && isAssignedStaff) return true
  return false
}

export function canBrowseCalendar(role: SessionRole | null | undefined): boolean {
  return role === 'member' || role === 'company_admin'
}

export function canManageCompanyEvents(
  role: SessionRole | null | undefined,
  companyId?: string | null,
): boolean {
  return role === 'company_admin' && Boolean(companyId)
}

export function isPersonalCalendarSession(
  role: SessionRole | null | undefined,
  companyId?: string | null,
): boolean {
  return role === 'member' && !companyId
}
