import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  clearServiceAuthSession,
  readServiceAuthSession,
  writeServiceAuthSession,
} from '@webonone/platform-embed'
import { isFresh } from '@/shared/store/cacheUtils'
import type { UserProfile } from '../types/auth.types'

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  lastProfileFetchedAt: number | null
}

export const WEBONONE_AUTH_STORAGE_KEY = 'webonone_auth'

export function clearWebOnOneAuthStorage(): void {
  clearServiceAuthSession(WEBONONE_AUTH_STORAGE_KEY)
}

function loadStoredAuth(): AuthState {
  const stored = readServiceAuthSession<UserProfile>(WEBONONE_AUTH_STORAGE_KEY)
  if (!stored) {
    return { accessToken: null, user: null, lastProfileFetchedAt: null }
  }
  return {
    accessToken: stored.accessToken,
    user: stored.user,
    lastProfileFetchedAt: null,
  }
}

function persistAuth(state: Pick<AuthState, 'accessToken' | 'user'>) {
  if (state.accessToken && state.user) {
    writeServiceAuthSession(WEBONONE_AUTH_STORAGE_KEY, {
      accessToken: state.accessToken,
      user: state.user,
    })
  } else {
    clearWebOnOneAuthStorage()
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
      state.lastProfileFetchedAt = Date.now()
      persistAuth(state)
    },
    tokenRefreshed(state, action: PayloadAction<{ accessToken: string; user?: UserProfile }>) {
      state.accessToken = action.payload.accessToken
      if (action.payload.user) {
        state.user = action.payload.user
        state.lastProfileFetchedAt = Date.now()
      }
      persistAuth(state)
    },
    userProfileUpdated(state, action: PayloadAction<UserProfile>) {
      if (!state.accessToken) return
      state.user = action.payload
      state.lastProfileFetchedAt = Date.now()
      persistAuth(state)
    },
    profileFetchRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastProfileFetchedAt) && state.user) {
        return
      }
    },
    profileFetchSucceeded(state, action: PayloadAction<UserProfile>) {
      if (!state.accessToken) return
      state.user = action.payload
      state.lastProfileFetchedAt = Date.now()
      persistAuth(state)
    },
    profileFetchSkipped() {
      // Keep cached profile when refresh fails or cache is fresh
    },
    logout(state) {
      state.accessToken = null
      state.user = null
      state.lastProfileFetchedAt = null
      persistAuth(state)
    },
  },
})

export const authReducer = authSlice.reducer
export const authActions = authSlice.actions
