import type { SessionRole } from '@/shared/types'
import {
  canBrowseCalendar,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/calendar/utils/calendarAccess'
import { addDaysYmd, toYmd } from '@/features/calendar/utils/dateYmd'
import type { CompanyEventOccurrence } from '@/features/calendar/types/event.types'

export const DASHBOARD_UPCOMING_DAYS = 30
export const DASHBOARD_UPCOMING_LIMIT = 8

export type DashboardEventAudience = 'member' | 'admin' | 'staff'

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

export function dashboardEventAudience(
  role: SessionRole | null | undefined,
  companyId: string | null | undefined,
): DashboardEventAudience | null {
  if (!canBrowseCalendar(role)) return null
  if (isPersonalCalendarSession(role, companyId)) return 'member'
  if (canManageCompanyEvents(role, companyId)) return 'admin'
  return 'staff'
}

export function selectTodayOccurrences(
  items: CompanyEventOccurrence[],
  today: string,
): CompanyEventOccurrence[] {
  return items.filter((item) => item.occurrenceDate === today)
}

export function selectUpcomingOccurrences(
  items: CompanyEventOccurrence[],
  today: string,
): CompanyEventOccurrence[] {
  return items
    .filter((item) => item.occurrenceDate > today)
    .slice(0, DASHBOARD_UPCOMING_LIMIT)
}
