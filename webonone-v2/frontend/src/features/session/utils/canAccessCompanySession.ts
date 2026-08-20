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

/**
 * Delay / notify on a session — company_admin or assigned event staff only
 * (not super_admin; not non-assigned members).
 */
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

/** Schedule/Events list pages — Default User (member, no company) and company sessions. */
export function canBrowseCalendar(role: SessionRole | null | undefined): boolean {
  return role === 'member' || role === 'company_admin'
}

/** Create / edit / remove company calendar events — company_admin only. */
export function canManageCompanyEvents(
  role: SessionRole | null | undefined,
  companyId?: string | null,
): boolean {
  return role === 'company_admin' && Boolean(companyId)
}

/** Default User browsing their own bookings/tokens (no company session). */
export function isPersonalCalendarSession(
  role: SessionRole | null | undefined,
  companyId?: string | null,
): boolean {
  return role === 'member' && !companyId
}
