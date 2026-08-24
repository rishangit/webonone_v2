import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { sessionRoleEpics } from '@/features/session/store/sessionRoleEpics'
import { companiesEpics } from '@/features/settings/basic/store/companiesStore'
import { companyCatalogEpics } from '@/features/company-catalog/store/companyCatalogStore'
import { staffEpics, staffLeavesEpics } from '@/features/staff/store'
import { salesEpics } from '@/features/sales/store'
import { eventsEpics, sessionTokensEpics, sessionCheckInsEpics } from '@/features/calendar/store'
import { homeDashboardEpics } from '@/features/home/store'
import { systemThemeEpics } from '@/features/settings/system-theme/store/systemThemeEpics'
import { aiSettingsEpics } from '@/features/settings/basic/store/aiSettingsEpics'
import { notificationsEpics } from '@/features/notifications/store/notificationsEpics'

export const rootEpic = combineEpics(
  authEpics,
  sessionRoleEpics,
  companiesEpics,
  companyCatalogEpics,
  staffEpics,
  staffLeavesEpics,
  salesEpics,
  eventsEpics,
  sessionTokensEpics,
  sessionCheckInsEpics,
  homeDashboardEpics,
  systemThemeEpics,
  aiSettingsEpics,
  ...notificationsEpics,
)
