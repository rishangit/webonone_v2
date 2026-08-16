import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { conversationsEpics } from '@/features/chat/store'

export const rootEpic = combineEpics(authEpics, conversationsEpics)
