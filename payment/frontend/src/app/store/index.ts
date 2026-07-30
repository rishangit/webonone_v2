import { configureStore } from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import { authReducer } from '@/features/auth/store/authSlice'
import { dashboardReducer } from '@/features/dashboard/store'
import { invoicesReducer } from '@/features/invoices/store'
import { initApiClient } from '@/shared/services/apiClient'
import { rootEpic } from '@/app/store/epics/rootEpic'

const epicMiddleware = createEpicMiddleware()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    invoices: invoicesReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false }).concat(epicMiddleware),
})

initApiClient(store)

epicMiddleware.run(rootEpic)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
