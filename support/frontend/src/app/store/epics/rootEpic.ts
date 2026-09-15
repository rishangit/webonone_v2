import { combineEpics } from 'redux-observable'
import { feedbackEpics } from '@/features/feedback/store/feedbackEpics'

export const rootEpic = combineEpics(feedbackEpics)
