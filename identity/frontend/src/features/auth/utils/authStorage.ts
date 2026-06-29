import type { UserProfile } from '../types/auth.types'

const STORAGE_KEY = 'identity_auth'

export interface StoredAuthSession {
  accessToken: string
  refreshToken: string | null
  user: UserProfile
}

export function loadStoredAuthSession(): StoredAuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredAuthSession
    if (!parsed.accessToken || !parsed.user) return null

    return parsed
  } catch {
    return null
  }
}

export function persistAuthSession(session: StoredAuthSession | null): void {
  try {
    if (session?.accessToken && session.user) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore sessionStorage errors
  }
}
