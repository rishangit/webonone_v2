import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  clearServiceAuthSession,
  readServiceAuthSession,
  writeServiceAuthSession,
} from '@webonone/platform-embed'
import type { UserProfile } from '@/features/auth/types/auth.types'

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
}

export const SUPPORT_AUTH_STORAGE_KEY = 'support_auth'

export function clearSupportAuthStorage(): void {
  clearServiceAuthSession(SUPPORT_AUTH_STORAGE_KEY)
}

function loadStoredAuth(): Pick<AuthState, 'accessToken' | 'user'> {
  const stored = readServiceAuthSession<UserProfile>(SUPPORT_AUTH_STORAGE_KEY)
  if (!stored) {
    return { accessToken: null, user: null }
  }
  return {
    accessToken: stored.accessToken,
    user: stored.user,
  }
}

function persistAuth(state: Pick<AuthState, 'accessToken' | 'user'>) {
  if (state.accessToken && state.user) {
    writeServiceAuthSession(SUPPORT_AUTH_STORAGE_KEY, {
      accessToken: state.accessToken,
      user: state.user,
    })
  } else {
    clearServiceAuthSession(SUPPORT_AUTH_STORAGE_KEY)
  }
}

const initialState: AuthState = {
  ...loadStoredAuth(),
}

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
