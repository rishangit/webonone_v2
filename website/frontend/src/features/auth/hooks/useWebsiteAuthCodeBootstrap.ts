import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  usePlatformRedirectBootstrap,
  type ExchangeAuthCodeResult,
} from '@webonone/platform-nav'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'

export function getWebsiteRedirectUri(path = '/'): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '')
    if (path === '/' || path === '') {
      return `${origin}/`
    }
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`
  }
  return 'http://127.0.0.1:3018/'
}

type AuthCodeBootstrapState = {
  isBootstrapping: boolean
  bootstrapError: string | null
}

/** Exchange `?code=` from WebOnOne login return into a local website session. */
export function useWebsiteAuthCodeBootstrap(): AuthCodeBootstrapState {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useWebsiteAuth()
  const code = searchParams.get('code')
  const isRedirectHandoff = Boolean(code)

  const getRedirectUri = useCallback((path: string) => getWebsiteRedirectUri(path), [])

  const onSuccess = useCallback(
    (result: ExchangeAuthCodeResult) => {
      login({
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
          avatarUrl: result.user.avatarUrl ?? null,
        },
      })
    },
    [login],
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
