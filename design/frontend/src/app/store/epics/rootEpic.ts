import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { formsEpics } from '@/features/forms/store'
import {
  websiteFootersEpics,
  websiteHeadersEpics,
  websitePagesEpics,
  websiteThemesEpics,
} from '@/features/website/store'

export const rootEpic = combineEpics(
  authEpics,
  formsEpics,
  websitePagesEpics,
  websiteHeadersEpics,
  websiteFootersEpics,
  websiteThemesEpics,
)
