import { configureStore } from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import { authReducer } from '@/features/auth/store/authSlice'
import { formsReducer } from '@/features/forms/store'
import {
  websiteFootersReducer,
  websiteHeadersReducer,
  websiteLayoutsReducer,
  websitePagesReducer,
  websitePresetsReducer,
  websiteThemesReducer,
} from '@/features/website/store/websiteStore'
import { websiteDatasetsReducer } from '@/features/website/store/websiteDatasetsStore'
import {
  websiteFontLibraryCreateReducer,
  websiteFontLibraryReducer,
} from '@/features/website/store/websiteFontLibraryStore'
import { websiteSettingsReducer } from '@/features/website/store/websiteSettingsStore'
import {
  websiteLibraryBrowseReducer,
  websiteLibraryCopyReducer,
} from '@/features/website/store/websiteLibraryCopyStore'
import { setWebsiteLibraryCatalog } from '@/features/website/utils/websiteCatalogScope'
import { initApiClient } from '@/shared/services/apiClient'
import { rootEpic } from '@/app/store/epics/rootEpic'

const epicMiddleware = createEpicMiddleware()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    forms: formsReducer,
    websitePages: websitePagesReducer,
    websitePresets: websitePresetsReducer,
    websiteDatasets: websiteDatasetsReducer,
    websiteHeaders: websiteHeadersReducer,
    websiteFooters: websiteFootersReducer,
    websiteLayouts: websiteLayoutsReducer,
    websiteThemes: websiteThemesReducer,
    websiteSettings: websiteSettingsReducer,
    websiteFontLibrary: websiteFontLibraryReducer,
    websiteFontLibraryCreate: websiteFontLibraryCreateReducer,
    websiteLibraryCopy: websiteLibraryCopyReducer,
    websiteLibraryBrowse: websiteLibraryBrowseReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false }).concat(epicMiddleware),
})

initApiClient(store)

function syncWebsiteCatalogScope() {
  setWebsiteLibraryCatalog(store.getState().auth.user?.role === 'super_admin')
}
syncWebsiteCatalogScope()
store.subscribe(syncWebsiteCatalogScope)

epicMiddleware.run(rootEpic)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
