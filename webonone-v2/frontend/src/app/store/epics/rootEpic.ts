import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { sessionRoleEpics } from '@/features/session/store/sessionRoleEpics'
import { companiesEpics } from '@/features/settings/basic/store/companiesStore'
import { systemThemeEpics } from '@/features/settings/system-theme/store/systemThemeEpics'

export const rootEpic = combineEpics(authEpics, sessionRoleEpics, companiesEpics, systemThemeEpics)
