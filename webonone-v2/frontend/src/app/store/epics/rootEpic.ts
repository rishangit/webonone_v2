import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { sessionRoleEpics } from '@/features/session/store/sessionRoleEpics'
import { companiesEpics } from '@/features/settings/basic/store/companiesStore'
import { companyCatalogEpics } from '@/features/company-catalog/store/companyCatalogStore'
import { staffEpics } from '@/features/staff/store'
import { salesEpics } from '@/features/sales/store'
import { eventsEpics, sessionTokensEpics } from '@/features/calendar/store'
import { homeDashboardEpics } from '@/features/home/store'
import { systemThemeEpics } from '@/features/settings/system-theme/store/systemThemeEpics'
import { aiSettingsEpics } from '@/features/settings/basic/store/aiSettingsEpics'

export const rootEpic = combineEpics(
  authEpics,
  sessionRoleEpics,
  companiesEpics,
  companyCatalogEpics,
  staffEpics,
  salesEpics,
  eventsEpics,
  sessionTokensEpics,
  homeDashboardEpics,
  systemThemeEpics,
  aiSettingsEpics,
)
