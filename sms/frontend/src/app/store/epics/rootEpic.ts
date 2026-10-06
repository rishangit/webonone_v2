import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { dashboardEpics, smsCreditsEpics } from '@/features/dashboard/store'
import { devicesEpics } from '@/features/devices/store'
import { gatewayEpics } from '@/features/gateway/store'
import { historyEpics } from '@/features/history/store'
import { queueEpics } from '@/features/queue/store'
import { sendEpics } from '@/features/send/store'
import { templatesEpics } from '@/features/templates/store'

export const rootEpic = combineEpics(
  authEpics,
  dashboardEpics,
  smsCreditsEpics,
  devicesEpics,
  gatewayEpics,
  historyEpics,
  queueEpics,
  sendEpics,
  templatesEpics,
)
