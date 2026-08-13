import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  usePlatformRedirectBootstrap,
  type ExchangeAuthCodeResult,
} from '@webonone/platform-nav'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'

const LOG = '[website-sso]'

export function getWebsiteRedirectUri(path = '/', search = ''): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/$/, '')
    const pathname = path === '/' || path === '' ? '/' : path.startsWith('/') ? path : `/${path}`
    const qs = search.startsWith('?') ? search.slice(1) : search
    const withQuery = qs ? `${pathname}?${qs}` : pathname
    if (withQuery === '/') {
      return `${origin}/`
    }
    return `${origin}${withQuery}`
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

  useEffect(() => {
    if (!code) {
      return
    }
    console.warn(LOG, 'auth-code bootstrap will exchange ?code=', {
      href: window.location.href,
      codePrefix: `${code.slice(0, 8)}…`,
    })
  }, [code])

  /** Must match the redirectUri used when creating the auth code (full path + search, minus code). */
  const getRedirectUri = useCallback(
    (path: string) => {
      const params = new URLSearchParams(searchParams)
      params.delete('code')
      params.delete('state')
      return getWebsiteRedirectUri(path, params.toString())
    },
    [searchParams],
  )

  const onSuccess = useCallback(
    (result: ExchangeAuthCodeResult) => {
      console.warn(LOG, 'auth-code exchange success → website login', {
        userId: result.user.id,
        email: result.user.email,
      })
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
