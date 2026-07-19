import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { usersEpics } from '@/features/users/store'

export const rootEpic = combineEpics(authEpics, usersEpics)
