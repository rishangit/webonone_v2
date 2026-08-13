import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QUERY, redirectWithAuthCode } from '@webonone/platform-nav'
import { readWebsiteAuthSession } from '@/features/auth/utils/authStorage'
import {
  getAppHandoffFallbackUrl,
  parseAppReturnUrl,
} from '@/features/auth/utils/appReturnConfig'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'

const LOG = '[website-sso-bridge]'
const SSO_BRIDGE_DONE = 'done'

function appendSsoBridgeDone(url: string): string {
  const parsed = new URL(url)
  // Auth handoff without a code cannot exchange — send guests to /login for Identity fallback.
  if (parsed.pathname.replace(/\/$/, '') === '/auth/handoff') {
    parsed.pathname = '/login'
  }
  parsed.searchParams.set('sso_bridge', SSO_BRIDGE_DONE)
  parsed.searchParams.delete('prompt')
  parsed.searchParams.delete('code')
  parsed.searchParams.delete('state')
  return parsed.toString()
}

function returnUrlRequestsLogin(url: string): boolean {
  try {
    return new URL(url).searchParams.get('prompt') === 'login'
  } catch {
    return false
  }
}

/**
 * Top-level SSO probe for the WebOnOne app.
 * Reads first-party website_auth and mints an auth-code to return_url
 * (typically app `/auth/handoff`).
 */
export function AuthSsoBridgePage() {
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const rawReturn = searchParams.get(QUERY.RETURN_URL)
    const parsedReturn = parseAppReturnUrl(rawReturn) ?? getAppHandoffFallbackUrl()
    const session = readWebsiteAuthSession()
    const promptLoginOnReturn = returnUrlRequestsLogin(parsedReturn)

    console.log(LOG, 'start', {
      href: window.location.href,
      rawReturn,
      parsedReturn,
      hasWebsiteAuth: Boolean(session?.accessToken),
      userId: session?.user?.id,
      promptLoginOnReturn,
    })

    if (promptLoginOnReturn) {
      const next = appendSsoBridgeDone(parsedReturn)
      console.log(LOG, 'prompt=login on return → done only', { next })
      window.location.replace(next)
      return
    }

    if (session?.accessToken) {
      console.warn(LOG, 'website_auth present → mint auth-code to app', {
        parsedReturn,
        userId: session.user.id,
      })
      void redirectWithAuthCode({
        accessToken: session.accessToken,
        authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
        targetUrl: parsedReturn,
        errorMessage: 'Failed to hand off session to app',
      }).catch((err: unknown) => {
        console.error(LOG, 'auth-code mint failed → done', err)
        window.location.replace(appendSsoBridgeDone(parsedReturn))
      })
      return
    }

    const next = appendSsoBridgeDone(parsedReturn)
    console.log(LOG, 'no website_auth → done', { next })
    window.location.replace(next)
  }, [searchParams])

  return (
    <div className="flex h-dvh items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Checking session…</p>
    </div>
  )
}
