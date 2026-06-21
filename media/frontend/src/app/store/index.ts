import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from '@/features/auth/store/authSlice'
import { initApiClient } from '@/shared/services/apiClient'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

initApiClient(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
