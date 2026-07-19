import {
  clearServiceAuthSession,
  readServiceAuthSession,
  writeServiceAuthSession,
} from '@webonone/platform-embed'
import type { UserProfile } from '@/shared/types/auth.types'

export const IDENTITY_AUTH_STORAGE_KEY = 'identity_auth'

export interface StoredAuthSession {
  accessToken: string
  refreshToken: string | null
  user: UserProfile
}

export function isPromptLoginRequest(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return new URLSearchParams(window.location.search).get('prompt') === 'login'
}

export function clearStoredAuthSession(): void {
  clearServiceAuthSession(IDENTITY_AUTH_STORAGE_KEY)
}

export function loadStoredAuthSession(): StoredAuthSession | null {
  if (isPromptLoginRequest()) {
    clearStoredAuthSession()
    return null
  }

  const stored = readServiceAuthSession<UserProfile>(IDENTITY_AUTH_STORAGE_KEY)
  if (!stored) {
    return null
  }

  return {
    accessToken: stored.accessToken,
    refreshToken: typeof stored.refreshToken === 'string' ? stored.refreshToken : null,
    user: stored.user,
  }
}

export function persistAuthSession(session: StoredAuthSession | null): void {
  if (session?.accessToken && session.user) {
    writeServiceAuthSession(IDENTITY_AUTH_STORAGE_KEY, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
    })
  } else {
    clearStoredAuthSession()
  }
}
