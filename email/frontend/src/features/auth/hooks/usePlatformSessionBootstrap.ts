import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CORE_NAV_QUERY_PARAM,
  parsePlatformNavVariant,
  usePlatformRedirectBootstrap,
  type ExchangeAuthCodeResult,
} from '@webonone/platform-nav'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { fetchEmailRole } from '@/features/auth/utils/fetchEmailRole'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import {
  hasPlatformHandoff,
  parsePlatformReturnUrl,
} from '@/features/auth/utils/platformReturn'

export function getEmailRedirectUri(path = '/'): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '')
    if (path === '/' || path === '') {
      return `${origin}/`
    }
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`
  }

  return 'http://localhost:3014/'
}

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

  const getRedirectUri = useCallback((path: string) => getEmailRedirectUri(path), [])

  const onSuccess = useCallback(
    async (result: ExchangeAuthCodeResult) => {
      const validatedReturnUrl = parsePlatformReturnUrl(searchParams)
      const coreNavVariant = parsePlatformNavVariant(searchParams.get(CORE_NAV_QUERY_PARAM))
      const role: EmailRole = await fetchEmailRole(result.accessToken)

      if (validatedReturnUrl) {
        dispatch(
          authActions.setPlatformContext({
            returnUrl: validatedReturnUrl,
            coreNavVariant,
          }),
        )
      }

      dispatch(
        authActions.loginSuccess({
          accessToken: result.accessToken,
          user: {
            id: result.user.id,
            email: result.user.email,
            displayName: result.user.displayName,
            avatarUrl: result.user.avatarUrl ?? null,
            role,
          },
        }),
      )
    },
    [dispatch, searchParams],
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
