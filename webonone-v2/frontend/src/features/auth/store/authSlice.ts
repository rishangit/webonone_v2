import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { isFresh } from '@/shared/store/cacheUtils'
import type { UserProfile } from '../types/auth.types'

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  lastProfileFetchedAt: number | null
}

const STORAGE_KEY = 'webonone_auth'

export function clearWebOnOneAuthStorage(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

function loadStoredAuth(): AuthState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { accessToken: null, user: null, lastProfileFetchedAt: null }
    const parsed = JSON.parse(raw) as Pick<AuthState, 'accessToken' | 'user'>
    return {
      accessToken: parsed.accessToken ?? null,
      user: parsed.user ?? null,
      lastProfileFetchedAt: null,
    }
  } catch {
    return { accessToken: null, user: null, lastProfileFetchedAt: null }
  }
}

function persistAuth(state: Pick<AuthState, 'accessToken' | 'user'>) {
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
