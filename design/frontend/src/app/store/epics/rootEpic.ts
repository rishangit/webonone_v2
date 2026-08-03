import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { formsEpics } from '@/features/forms/store'

export const rootEpic = combineEpics(authEpics, formsEpics)
