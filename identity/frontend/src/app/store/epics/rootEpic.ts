import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'

export const rootEpic = combineEpics(authEpics)
