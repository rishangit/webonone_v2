import { useEffect, useRef } from 'react'
import {
  readServiceAuthSession,
  type ServiceAuthSession,
} from './serviceAuthStorage'

export type UseServiceAuthStorageSyncOptions = {
  storageKey: string
  currentAccessToken: string | null | undefined
  onPersistedSession: (session: ServiceAuthSession) => void
}

/**
 * Rehydrate a service JWT when another same-origin tab/iframe writes auth storage
 * (e.g. user signs in via /login while an embed waits for authentication).
 */
export function useServiceAuthStorageSync({
  storageKey,
  currentAccessToken,
  onPersistedSession,
}: UseServiceAuthStorageSyncOptions): void {
  const onPersistedSessionRef = useRef(onPersistedSession)
  onPersistedSessionRef.current = onPersistedSession

  useEffect(() => {
    if (!storageKey) {
      return
    }

    function applyStoredAuth(onlyWhenMissing: boolean) {
      if (onlyWhenMissing && currentAccessToken) {
        return
      }

      const stored = readServiceAuthSession(storageKey)
      if (!stored?.accessToken) {
        return
      }
      if (stored.accessToken === currentAccessToken) {
        return
      }

      onPersistedSessionRef.current(stored)
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== storageKey) {
        return
      }
      applyStoredAuth(false)
    }

    function onVisible() {
      if (document.visibilityState === 'visible') {
        applyStoredAuth(true)
      }
    }

    function onFocus() {
      applyStoredAuth(true)
    }

    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [currentAccessToken, storageKey])
}
