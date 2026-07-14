import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { dashboardEpics } from '@/features/dashboard/store'
import { historyEpics } from '@/features/history/store'
import { providersEpics } from '@/features/providers/store'
import { queueEpics } from '@/features/queue/store'
import { sendEpics } from '@/features/send/store'
import { settingsEpics } from '@/features/settings/store'
import { templatesEpics } from '@/features/templates/store'

export const rootEpic = combineEpics(
  authEpics,
  dashboardEpics,
  historyEpics,
  providersEpics,
  queueEpics,
  sendEpics,
  settingsEpics,
  templatesEpics,
)
