import type { SessionRole } from '@/features/session/types/sessionRole.types'
import {
  canBrowseCalendar,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/session/utils/canAccessCompanySession'

export const DASHBOARD_UPCOMING_DAYS = 30
export const DASHBOARD_UPCOMING_LIMIT = 8

export type DashboardEventAudience = 'member' | 'admin' | 'staff'

export function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y!, m! - 1, d!)
  date.setDate(date.getDate() + days)
  return toYmd(date)
}

export function dashboardOccurrenceRange(now = new Date()): {
  today: string
  from: string
  to: string
} {
  const today = toYmd(now)
  return {
    today,
    from: today,
    to: addDaysYmd(today, DASHBOARD_UPCOMING_DAYS),
  }
}

export function dashboardSessionKey(
  role: SessionRole | null | undefined,
  companyId: string | null | undefined,
): string {
  return `${role ?? ''}:${companyId ?? ''}`
}

export function dashboardEventAudience(
  role: SessionRole | null | undefined,
  companyId: string | null | undefined,
): DashboardEventAudience | null {
  if (!canBrowseCalendar(role)) return null
  if (isPersonalCalendarSession(role, companyId)) return 'member'
  if (canManageCompanyEvents(role, companyId)) return 'admin'
  return 'staff'
}
