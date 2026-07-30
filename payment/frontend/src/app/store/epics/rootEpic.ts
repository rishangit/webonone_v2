import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { dashboardEpics } from '@/features/dashboard/store'
import { invoicesEpics } from '@/features/invoices/store'

export const rootEpic = combineEpics(authEpics, dashboardEpics, invoicesEpics)
