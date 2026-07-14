import { useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import {
  decodeJwtPayload,
  PlatformEmbedShell,
  usePlatformEmbedAuth,
  usePlatformEmbedContentReady,
} from '@webonone/platform-embed'
import { LoadingState } from '@webonone/ui-kit'
import { useEmbedThemeListener } from '@webonone/theme'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformOverlayLabel } from '@/features/auth/context/PlatformLoadingContext'
import { authActions } from '@/features/auth/store'
import type { UserProfile } from '@/shared/types/auth.types'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'

type PlatformEmbedLayoutProps = {
  parentOrigin: string
}

function minimalUserFromClaims(claims: NonNullable<ReturnType<typeof decodeJwtPayload>>): UserProfile {
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
    isGoogleUser: false,
  }
}

export function PlatformEmbedLayout({ parentOrigin }: PlatformEmbedLayoutProps) {
  useEmbedThemeListener(parentOrigin)

  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const overlayLabel = usePlatformOverlayLabel()

  const handleAccessToken = useCallback(
    (token: string) => {
      const claims = decodeJwtPayload(token)
      if (!claims) {
        return
      }

      dispatch(
        authActions.loginSucceeded({
          accessToken: token,
          user: minimalUserFromClaims(claims),
        }),
      )
    },
    [dispatch],
  )

  const { isAwaitingToken } = usePlatformEmbedAuth({
    parentOrigin,
    isAllowedParentOrigin,
    persistedAccessToken: accessToken,
    onAccessToken: handleAccessToken,
  })

  useEffect(() => {
    if (accessToken && !isAwaitingToken) {
      dispatch(authActions.profileFetchRequested())
    }
  }, [accessToken, dispatch, isAwaitingToken])

  const { hasReported } = usePlatformEmbedContentReady({
    parentOrigin,
    isContentReady: !isAwaitingToken && overlayLabel === null,
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
