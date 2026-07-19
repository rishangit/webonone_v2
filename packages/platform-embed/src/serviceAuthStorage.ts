/**
 * Shared JWT session persistence for every microservice SPA.
 * Uses localStorage so same-origin tabs and iframes share a session
 * (sessionStorage is isolated per top-level browsing context).
 */

export type ServiceAuthSession<TUser = unknown> = {
  accessToken: string
  user: TUser
} & Record<string, unknown>

function canUseStorage(): boolean {
  return typeof window !== 'undefined'
}

export function readServiceAuthSession<TUser = unknown>(
  storageKey: string,
): ServiceAuthSession<TUser> | null {
  if (!canUseStorage()) {
    return null
  }

  try {
    const raw =
      localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as ServiceAuthSession<TUser>
    if (!parsed.accessToken || !parsed.user) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeServiceAuthSession(
  storageKey: string,
  session: ServiceAuthSession | null,
): void {
  if (!canUseStorage()) {
    return
  }

  try {
    if (session?.accessToken && session.user) {
      localStorage.setItem(storageKey, JSON.stringify(session))
      sessionStorage.removeItem(storageKey)
    } else {
      clearServiceAuthSession(storageKey)
    }
  } catch {
    // ignore storage errors
  }
}

export function clearServiceAuthSession(storageKey: string): void {
  if (!canUseStorage()) {
    return
  }

  try {
    localStorage.removeItem(storageKey)
    sessionStorage.removeItem(storageKey)
  } catch {
    // ignore storage errors
  }
}
