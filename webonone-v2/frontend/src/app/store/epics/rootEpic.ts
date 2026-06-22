import { combineEpics } from 'redux-observable'
import { systemThemeEpics } from '@/features/settings/system-theme/store/systemThemeEpics'

export const rootEpic = combineEpics(systemThemeEpics)
