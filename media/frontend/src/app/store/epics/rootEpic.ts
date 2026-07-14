import { combineEpics } from 'redux-observable'
import { mediaEpics } from '@/features/media/store'

export const rootEpic = combineEpics(mediaEpics)
