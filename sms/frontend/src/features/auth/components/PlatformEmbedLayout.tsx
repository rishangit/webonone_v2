import { useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import {
  decodeJwtPayload,
  PlatformEmbedShell,
  usePlatformEmbedAuth,
  usePlatformEmbedContentReady,
  type PlatformRole,
  type ServiceAuthSession,
} from '@webonone/platform-embed'
import { LoadingState } from '@webonone/ui-kit'
import { useEmbedThemeListener } from '@webonone/theme'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformOverlayLabel } from '@/features/auth/context/PlatformLoadingContext'
import { authActions, SMS_AUTH_STORAGE_KEY } from '@/features/auth/store/authSlice'
import { useRefreshSmsRole } from '@/features/auth/hooks/useRefreshSmsRole'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { SmsRole, UserProfile } from '@/features/auth/types/auth.types'

type PlatformEmbedLayoutProps = {
  parentOrigin: string
}

function roleFromClaims(platformRole?: PlatformRole): SmsRole {
  if (platformRole === 'super_admin' || platformRole === 'company_admin' || platformRole === 'member') {
    return platformRole
  }
  return 'member'
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
        authActions.loginSuccess({
          accessToken: token,
          user: {
            id: claims.sub,
            email: claims.email,
            displayName: claims.email,
            avatarUrl: null,
            role: roleFromClaims(claims.platform_role),
          },
        }),
      )
    },
    [dispatch],
  )

  const handlePersistedSession = useCallback(
    (session: ServiceAuthSession) => {
      dispatch(
        authActions.loginSuccess({
          accessToken: session.accessToken,
          user: session.user as UserProfile,
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
    authStorageKey: SMS_AUTH_STORAGE_KEY,
    onPersistedSession: handlePersistedSession,
  })

  useRefreshSmsRole(isAwaitingToken)

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
