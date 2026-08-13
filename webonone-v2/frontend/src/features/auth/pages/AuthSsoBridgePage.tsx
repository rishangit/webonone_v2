import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QUERY } from '@webonone/platform-nav'
import { readServiceAuthSession } from '@webonone/platform-embed'
import { WEBONONE_AUTH_STORAGE_KEY } from '@/features/auth/store/authSlice'
import type { UserProfile } from '@/features/auth/types/auth.types'
import { redirectToWebsiteWithAuthCode } from '@/features/auth/utils/redirectToWebsite'
import {
  getWebsiteHomepageUrl,
  parseWebsiteReturnUrl,
} from '@/features/auth/utils/websiteConfig'

const LOG = '[webonone-sso-bridge]'
const SSO_BRIDGE_DONE = 'done'

function appendSsoBridgeDone(url: string): string {
  const parsed = new URL(url)
  parsed.searchParams.set('sso_bridge', SSO_BRIDGE_DONE)
  // Never echo prompt=login back — website treats that as logout, not SSO return.
  parsed.searchParams.delete('prompt')
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
 * Top-level SSO probe for the public website.
 * Reads first-party webonone_auth (iframe storage is partitioned and cannot).
 * Session → auth-code to return_url; none / post-logout → return_url?sso_bridge=done.
 */
export function AuthSsoBridgePage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const rawReturn = searchParams.get(QUERY.RETURN_URL)
    const parsedReturn = parseWebsiteReturnUrl(rawReturn) ?? getWebsiteHomepageUrl()
    const session = readServiceAuthSession<UserProfile>(WEBONONE_AUTH_STORAGE_KEY)
    const promptLoginOnReturn = returnUrlRequestsLogin(parsedReturn)

    console.log(LOG, 'start', {
      href: window.location.href,
      rawReturn,
      parsedReturn,
      hasWebononeAuth: Boolean(session?.accessToken),
      userId: session?.user?.id,
      promptLoginOnReturn,
    })

    // Post-logout return URLs must not mint a new website session.
    if (promptLoginOnReturn) {
      const next = appendSsoBridgeDone(parsedReturn)
      console.log(LOG, 'prompt=login on return → done only', { next })
      window.location.replace(next)
      return
    }

    if (session?.accessToken) {
      console.warn(LOG, 'webonone_auth present → mint auth-code (re-login path)', {
        parsedReturn,
        userId: session.user?.id,
      })
      void redirectToWebsiteWithAuthCode(session.accessToken, parsedReturn).catch((err) => {
        console.error(LOG, 'auth-code mint failed → done', err)
        window.location.replace(appendSsoBridgeDone(parsedReturn))
      })
      return
    }

    const next = appendSsoBridgeDone(parsedReturn)
    console.log(LOG, 'no webonone_auth → done', { next })
    window.location.replace(next)
  }, [searchParams])

  return (
    <div className="flex h-dvh items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">{t('callback.completing')}</p>
    </div>
  )
}
