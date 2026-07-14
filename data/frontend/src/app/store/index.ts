import { configureStore } from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import { attributesReducer } from '@/features/attributes/store'
import { authReducer } from '@/features/auth/store/authSlice'
import { dashboardReducer } from '@/features/dashboard/store'
import { productsReducer } from '@/features/products/store'
import { servicesReducer } from '@/features/services/store'
import { spacesReducer } from '@/features/spaces/store'
import { tagsReducer } from '@/features/tags/store'
import { unitsReducer } from '@/features/units/store'
import { initApiClient } from '@/shared/services/apiClient'
import { rootEpic } from '@/app/store/epics/rootEpic'

const epicMiddleware = createEpicMiddleware()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    tags: tagsReducer,
    units: unitsReducer,
    attributes: attributesReducer,
    products: productsReducer,
    services: servicesReducer,
    spaces: spacesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(epicMiddleware),
})

initApiClient(store)

epicMiddleware.run(rootEpic)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
