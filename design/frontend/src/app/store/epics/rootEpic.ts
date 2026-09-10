import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { formsEpics } from '@/features/forms/store'
import {
  websiteFootersEpics,
  websiteHeadersEpics,
  websiteLayoutsEpics,
  websitePagesEpics,
  websitePresetsEpics,
  websiteThemesEpics,
} from '@/features/website/store/websiteStore'
import { websiteDatasetsEpics } from '@/features/website/store/websiteDatasetsStore'
import { websiteSettingsEpics } from '@/features/website/store/websiteSettingsStore'

export const rootEpic = combineEpics(
  authEpics,
  formsEpics,
  websitePagesEpics,
  websitePresetsEpics,
  websiteDatasetsEpics,
  websiteHeadersEpics,
  websiteFootersEpics,
  websiteLayoutsEpics,
  websiteThemesEpics,
  websiteSettingsEpics,
)
