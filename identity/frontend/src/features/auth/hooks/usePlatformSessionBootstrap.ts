import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { usePlatformRedirectBootstrap, type ExchangeAuthCodeResult } from '@webonone/platform-nav'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import type { UserProfile } from '@/shared/types/auth.types'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { hasPlatformHandoff } from '@/features/auth/utils/platformReturn'
import { getIdentityProfileRedirectUri } from '@/features/profile/utils/profileConfig'

type PlatformBootstrapState = {
  isBootstrapping: boolean
  bootstrapError: string | null
}

export function usePlatformSessionBootstrap(): PlatformBootstrapState {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const code = searchParams.get('code')
  const isRedirectHandoff = hasPlatformHandoff(searchParams)

  const getRedirectUri = useCallback((_path: string) => getIdentityProfileRedirectUri(), [])

  const onSuccess = useCallback(
    (result: ExchangeAuthCodeResult) => {
      dispatch(
        authActions.loginSucceeded({
          accessToken: result.accessToken,
          user: result.user as UserProfile,
        }),
      )
    },
    [dispatch],
  )

  return usePlatformRedirectBootstrap({
    code,
    isRedirectHandoff,
    pathname: location.pathname,
    searchParams,
    identityApiBase: getIdentityApiBase(),
    getRedirectUri,
    onSuccess,
    navigate: (to, options) => navigate(to, options),
  })
}
