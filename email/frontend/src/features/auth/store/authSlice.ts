import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  clearServiceAuthSession,
  readServiceAuthSession,
  writeServiceAuthSession,
} from '@webonone/platform-embed'
import { parsePlatformNavVariant, toCoreNavQueryValue, type PlatformNavVariant } from '@webonone/platform-nav'
import { isFresh } from '@/shared/store/cacheUtils'
import type { EmailRole, UserProfile } from '../types/auth.types'

interface PlatformContext {
  returnUrl: string | null
  coreNavVariant: PlatformNavVariant | null
}

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  platform: PlatformContext
  isProfileLoading: boolean
  lastProfileFetchedAt: number | null
}

export const EMAIL_AUTH_STORAGE_KEY = 'email_auth'
const PLATFORM_STORAGE_KEY = 'email_platform_context'

export function clearEmailAuthStorage(): void {
  clearServiceAuthSession(EMAIL_AUTH_STORAGE_KEY)
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
  const stored = readServiceAuthSession<UserProfile>(EMAIL_AUTH_STORAGE_KEY)
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
    writeServiceAuthSession(EMAIL_AUTH_STORAGE_KEY, {
      accessToken: state.accessToken,
      user: state.user,
    })
  } else {
    clearServiceAuthSession(EMAIL_AUTH_STORAGE_KEY)
  }
}

const initialState: AuthState = {
  ...loadStoredAuth(),
  platform: loadStoredPlatform(),
  isProfileLoading: false,
  lastProfileFetchedAt: null,
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
    logout(state) {
      state.accessToken = null
      state.user = null
      state.platform = { returnUrl: null, coreNavVariant: null }
      state.isProfileLoading = false
      state.lastProfileFetchedAt = null
      persistAuth(state)
      persistPlatform(state.platform)
    },
    profileFetchRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastProfileFetchedAt) && state.user?.role) {
        return
      }
      state.isProfileLoading = true
    },
    profileFetchSucceeded(state, action: PayloadAction<EmailRole>) {
      state.isProfileLoading = false
      state.lastProfileFetchedAt = Date.now()
      if (state.user) {
        state.user.role = action.payload
        persistAuth(state)
      }
    },
    profileFetchSkipped(state) {
      state.isProfileLoading = false
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
