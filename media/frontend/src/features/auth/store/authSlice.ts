import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  clearServiceAuthSession,
  readServiceAuthSession,
  writeServiceAuthSession,
} from '@webonone/platform-embed'
import type { UserProfile } from '../types/auth.types'

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
}

export const MEDIA_AUTH_STORAGE_KEY = 'media_auth'

export function clearMediaAuthStorage(): void {
  clearServiceAuthSession(MEDIA_AUTH_STORAGE_KEY)
}

function loadStoredAuth(): AuthState {
  const stored = readServiceAuthSession<UserProfile>(MEDIA_AUTH_STORAGE_KEY)
  if (!stored) {
    return { accessToken: null, user: null }
  }
  return {
    accessToken: stored.accessToken,
    user: stored.user,
  }
}

function persistAuth(state: AuthState) {
  if (state.accessToken && state.user) {
    writeServiceAuthSession(MEDIA_AUTH_STORAGE_KEY, {
      accessToken: state.accessToken,
      user: state.user,
    })
  } else {
    clearMediaAuthStorage()
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
