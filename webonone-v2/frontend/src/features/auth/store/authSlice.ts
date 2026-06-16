import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UserProfile } from '../types/auth.types'

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
}

const STORAGE_KEY = 'webonone_auth'

function loadStoredAuth(): AuthState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { accessToken: null, user: null }
    return JSON.parse(raw) as AuthState
  } catch {
    return { accessToken: null, user: null }
  }
}

function persistAuth(state: AuthState) {
  if (state.accessToken && state.user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

const initialState: AuthState = loadStoredAuth()

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ accessToken: string; user: UserProfile }>) {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      persistAuth(state)
    },
    logout(state) {
      state.accessToken = null
      state.user = null
      persistAuth(state)
    },
  },
})

export const authReducer = authSlice.reducer
export const authActions = authSlice.actions
