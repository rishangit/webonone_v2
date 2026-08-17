import { configureStore } from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import { authReducer } from '@/features/auth/store/authSlice'
import { formsReducer } from '@/features/forms/store'
import {
  websiteFootersReducer,
  websiteHeadersReducer,
  websitePagesReducer,
  websiteThemesReducer,
} from '@/features/website/store'
import { initApiClient } from '@/shared/services/apiClient'
import { rootEpic } from '@/app/store/epics/rootEpic'

const epicMiddleware = createEpicMiddleware()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    forms: formsReducer,
    websitePages: websitePagesReducer,
    websiteHeaders: websiteHeadersReducer,
    websiteFooters: websiteFootersReducer,
    websiteThemes: websiteThemesReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false }).concat(epicMiddleware),
})

initApiClient(store)

epicMiddleware.run(rootEpic)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
