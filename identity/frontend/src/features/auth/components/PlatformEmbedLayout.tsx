import { useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import {
  decodeJwtPayload,
  PlatformEmbedShell,
  usePlatformEmbedAuth,
  usePlatformEmbedContentReady,
  type ServiceAuthSession,
} from '@webonone/platform-embed'
import { LoadingState } from '@webonone/ui-kit'
import { useEmbedThemeListener } from '@webonone/theme'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import {
  usePlatformActiveLabel,
  usePlatformOverlayLabel,
} from '@/features/auth/context/PlatformLoadingContext'
import { authActions } from '@/features/auth/store'
import { IDENTITY_AUTH_STORAGE_KEY } from '@/features/auth/utils/authStorage'
import type { UserProfile } from '@/shared/types/auth.types'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'

type PlatformEmbedLayoutProps = {
  parentOrigin: string
}

function minimalUserFromClaims(
  claims: NonNullable<ReturnType<typeof decodeJwtPayload>>,
): UserProfile {
  return {
    id: claims.sub,
    email: claims.email,
    displayName: claims.email,
    firstName: '',
    lastName: '',
    phoneNumber: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    stateRegion: null,
    postalCode: null,
    country: null,
    avatarUrl: null,
    locale: null,
    isEmailVerified: false,
    isPhoneVerified: false,
    isGoogleUser: false,
  }
}

export function PlatformEmbedLayout({ parentOrigin }: PlatformEmbedLayoutProps) {
  useEmbedThemeListener(parentOrigin)

  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const overlayLabel = usePlatformOverlayLabel()
  const activeLabel = usePlatformActiveLabel()

  const handleAccessToken = useCallback(
    (token: string) => {
      const claims = decodeJwtPayload(token)
      if (!claims) {
        return
      }

      // Keep any richer same-user profile; always refresh from `/auth/me`.
      dispatch(
        authActions.embedAccessTokenReceived({
          accessToken: token,
          stubUser: minimalUserFromClaims(claims),
        }),
      )
      dispatch(authActions.profileFetchRequested({ force: true }))
    },
    [dispatch],
  )

  const handlePersistedSession = useCallback(
    (session: ServiceAuthSession) => {
      dispatch(
        authActions.loginSucceeded({
          accessToken: session.accessToken,
          refreshToken: typeof session.refreshToken === 'string' ? session.refreshToken : null,
          user: session.user as UserProfile,
        }),
      )
      dispatch(authActions.profileFetchRequested({ force: true }))
    },
    [dispatch],
  )

  const { isAwaitingToken } = usePlatformEmbedAuth({
    parentOrigin,
    isAllowedParentOrigin,
    persistedAccessToken: accessToken,
    onAccessToken: handleAccessToken,
    authStorageKey: IDENTITY_AUTH_STORAGE_KEY,
    onPersistedSession: handlePersistedSession,
  })

  useEffect(() => {
    if (accessToken && !isAwaitingToken) {
      dispatch(authActions.profileFetchRequested({ force: true }))
    }
  }, [accessToken, dispatch, isAwaitingToken])

  const { hasReported } = usePlatformEmbedContentReady({
    parentOrigin,
    isContentReady: !isAwaitingToken && activeLabel === null,
  })
  const displayLabel = hasReported ? overlayLabel : null

  return (
    <PlatformEmbedShell className="min-h-0 flex-1">
      <div className="platform-embed-outlet relative flex min-h-full w-full flex-col">
        <Outlet />
        {displayLabel ? (
          <LoadingState key="platform-loading" overlay overlayScope="content" label={displayLabel} />
        ) : null}
      </div>
    </PlatformEmbedShell>
  )
}
