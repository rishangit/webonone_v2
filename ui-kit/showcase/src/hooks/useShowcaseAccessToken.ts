import { useCallback, useState } from 'react'
import { useServiceAuthStorageSync } from '@webonone/platform-embed'
import {
  buildShowcaseLoginUrl,
  clearShowcaseAccessToken,
  readShowcaseAccessToken,
  SHOWCASE_AUTH_STORAGE_KEY,
} from '@/features/auth/showcaseAuth'

/** Parent-owned JWT for live Identity/Media embeds (same pattern as WebOnOne). */
export function useShowcaseAccessToken() {
  const [accessToken, setAccessToken] = useState<string>(() => readShowcaseAccessToken() ?? '')

  useServiceAuthStorageSync({
    storageKey: SHOWCASE_AUTH_STORAGE_KEY,
    currentAccessToken: accessToken || null,
    onPersistedSession: (session) => {
      setAccessToken(session.accessToken)
    },
  })

  const signIn = useCallback(() => {
    window.location.assign(buildShowcaseLoginUrl())
  }, [])

  const signOut = useCallback(() => {
    clearShowcaseAccessToken()
    setAccessToken('')
  }, [])

  return {
    accessToken,
    isAuthenticated: accessToken.length > 0,
    signIn,
    signOut,
  }
}
