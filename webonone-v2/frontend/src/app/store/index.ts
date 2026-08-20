import { configureStore } from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import { authActions, authReducer } from '@/features/auth/store/authSlice'
import { sessionRoleReducer } from '@/features/session/store/sessionRoleSlice'
import { companiesReducer } from '@/features/settings/basic/store/companiesStore'
import { companyCatalogReducer } from '@/features/company-catalog/store/companyCatalogStore'
import { staffReducer } from '@/features/staff/store'
import { salesReducer } from '@/features/sales/store'
import { eventsReducer, sessionTokensReducer } from '@/features/calendar/store'
import { homeDashboardReducer } from '@/features/home/store'
import { setDataLibraryTokenGetter } from '@/features/company-catalog/services/dataLibraryApi'
import { systemThemeReducer } from '@/features/settings/system-theme/store/systemThemeSlice'
import { aiSettingsReducer } from '@/features/settings/basic/store/aiSettingsSlice'
import { rootEpic } from '@/app/store/epics/rootEpic'
import { buildWebOnOneLoginHref } from '@/features/auth/utils/buildWebOnOneLoginHref'
import { initApiClient, setAuthRequiredHandler } from '@/shared/services/apiClient'

const epicMiddleware = createEpicMiddleware()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sessionRole: sessionRoleReducer,
    companies: companiesReducer,
    companyCatalog: companyCatalogReducer,
    staff: staffReducer,
    sales: salesReducer,
    events: eventsReducer,
    sessionTokens: sessionTokensReducer,
    homeDashboard: homeDashboardReducer,
    systemTheme: systemThemeReducer,
    aiSettings: aiSettingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(epicMiddleware),
})

initApiClient(store)
setDataLibraryTokenGetter(() => store.getState().auth.accessToken)
let authRequiredHandled = false
setAuthRequiredHandler(() => {
  if (authRequiredHandled) {
    return
  }
  authRequiredHandled = true
  const returnPath =
    typeof window === 'undefined'
      ? '/'
      : `${window.location.pathname}${window.location.search}`
  store.dispatch(authActions.logout())

  if (typeof window !== 'undefined') {
    const loginHref = buildWebOnOneLoginHref(returnPath, { promptLogin: true })
    window.location.assign(loginHref)
  }
})

epicMiddleware.run(rootEpic)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
