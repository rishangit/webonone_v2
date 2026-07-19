import { useCallback, useEffect, useRef, useState } from 'react'
import { isAccessTokenExpired } from './jwtClaims'
import { isPlatformInitMessage, PLATFORM_MESSAGE_TYPES } from './types'
import type { ServiceAuthSession } from './serviceAuthStorage'
import { useServiceAuthStorageSync } from './useServiceAuthStorageSync'

export type UsePlatformEmbedAuthOptions = {
  parentOrigin: string | null
  isAllowedParentOrigin: (origin: string) => boolean
  persistedAccessToken?: string | null
  onAccessToken: (accessToken: string) => void
  authStorageKey?: string
  /** Called when a full session is read from `authStorageKey` (cross-tab sync). */
  onPersistedSession?: (session: ServiceAuthSession) => void
}

export type UsePlatformEmbedAuthResult = {
  isAwaitingToken: boolean
}

export function usePlatformEmbedAuth({
  parentOrigin,
  isAllowedParentOrigin,
  persistedAccessToken,
  onAccessToken,
  authStorageKey,
  onPersistedSession,
}: UsePlatformEmbedAuthOptions): UsePlatformEmbedAuthResult {
  const onAccessTokenRef = useRef(onAccessToken)
  onAccessTokenRef.current = onAccessToken

  const hasValidPersistedToken = Boolean(
    persistedAccessToken && !isAccessTokenExpired(persistedAccessToken),
  )

  const [hasToken, setHasToken] = useState(hasValidPersistedToken)

  useEffect(() => {
    if (hasValidPersistedToken && persistedAccessToken) {
      setHasToken(true)
    }
  }, [hasValidPersistedToken, persistedAccessToken])

  const handleAccessToken = useCallback((accessToken: string) => {
    if (isAccessTokenExpired(accessToken)) {
      return
    }
    setHasToken(true)
    onAccessTokenRef.current(accessToken)
  }, [])

  const handlePersistedSession = useCallback(
    (session: ServiceAuthSession) => {
      if (isAccessTokenExpired(session.accessToken)) {
        return
      }
      setHasToken(true)
      if (onPersistedSession) {
        onPersistedSession(session)
        return
      }
      onAccessTokenRef.current(session.accessToken)
    },
    [onPersistedSession],
  )

  useServiceAuthStorageSync({
    storageKey: authStorageKey ?? '',
    currentAccessToken: persistedAccessToken,
    onPersistedSession: handlePersistedSession,
  })

  useEffect(() => {
    if (!parentOrigin || !isAllowedParentOrigin(parentOrigin)) {
      return
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) {
        return
      }

      if (isPlatformInitMessage(event.data)) {
        handleAccessToken(event.data.accessToken)
      }
    }

    window.addEventListener('message', onMessage)

    // Signal readiness to receive INIT (parent resends JWT after READY).
    window.parent.postMessage({ type: PLATFORM_MESSAGE_TYPES.READY }, parentOrigin)

    return () => window.removeEventListener('message', onMessage)
  }, [handleAccessToken, isAllowedParentOrigin, parentOrigin])

  return {
    isAwaitingToken: Boolean(parentOrigin) && !hasToken,
  }
}
