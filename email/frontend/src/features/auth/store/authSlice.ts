import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { parsePlatformNavVariant, toCoreNavQueryValue, type PlatformNavVariant } from '@webonone/platform-nav'
import type { EmailRole, UserProfile } from '../types/auth.types'

interface PlatformContext {
  returnUrl: string | null
  coreNavVariant: PlatformNavVariant | null
}

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  platform: PlatformContext
}

const STORAGE_KEY = 'email_auth'
const PLATFORM_STORAGE_KEY = 'email_platform_context'

export function clearEmailAuthStorage(): void {
  sessionStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(PLATFORM_STORAGE_KEY)
}

function loadStoredPlatform(): PlatformContext {
  try {
    const raw = sessionStorage.getItem(PLATFORM_STORAGE_KEY)
    if (!raw) {
      return { returnUrl: null, coreNavVariant: null }
    }
    const parsed = JSON.parse(raw) as { returnUrl?: string; coreNavVariant?: string }
    return {
      returnUrl: parsed.returnUrl ?? null,
      coreNavVariant: parsed.coreNavVariant
        ? parsePlatformNavVariant(parsed.coreNavVariant)
        : null,
    }
  } catch {
    return { returnUrl: null, coreNavVariant: null }
  }
}

function persistPlatform(platform: PlatformContext) {
  if (platform.returnUrl) {
    sessionStorage.setItem(
      PLATFORM_STORAGE_KEY,
      JSON.stringify({
        returnUrl: platform.returnUrl,
        coreNavVariant: platform.coreNavVariant
          ? toCoreNavQueryValue(platform.coreNavVariant)
          : null,
      }),
    )
  } else {
    sessionStorage.removeItem(PLATFORM_STORAGE_KEY)
  }
}

function loadStoredAuth(): Pick<AuthState, 'accessToken' | 'user'> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { accessToken: null, user: null }
    const parsed = JSON.parse(raw) as Pick<AuthState, 'accessToken' | 'user'>
    return {
      accessToken: parsed.accessToken ?? null,
      user: parsed.user ?? null,
    }
  } catch {
    return { accessToken: null, user: null }
  }
}

function persistAuth(state: Pick<AuthState, 'accessToken' | 'user'>) {
  if (state.accessToken && state.user) {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: state.accessToken, user: state.user }),
    )
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

const initialState: AuthState = {
  ...loadStoredAuth(),
  platform: loadStoredPlatform(),
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
    setUserRole(state, action: PayloadAction<EmailRole>) {
      if (state.user) {
        state.user.role = action.payload
        persistAuth(state)
      }
    },
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload
      if (!action.payload) {
        state.user = null
      }
      persistAuth(state)
    },
    logout(state) {
      state.accessToken = null
      state.user = null
      state.platform = { returnUrl: null, coreNavVariant: null }
      persistAuth(state)
      persistPlatform(state.platform)
    },
    setPlatformContext(
      state,
      action: PayloadAction<{ returnUrl: string; coreNavVariant: PlatformNavVariant }>,
    ) {
      state.platform = {
        returnUrl: action.payload.returnUrl,
        coreNavVariant: action.payload.coreNavVariant,
      }
      persistPlatform(state.platform)
    },
    clearPlatformContext(state) {
      state.platform = { returnUrl: null, coreNavVariant: null }
      persistPlatform(state.platform)
    },
  },
})

export const authReducer = authSlice.reducer
export const authActions = authSlice.actions
