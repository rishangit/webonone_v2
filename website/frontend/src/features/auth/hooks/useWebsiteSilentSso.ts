import { useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  buildIdentitySilentSsoUrl,
  isIdentitySsoNoneMessage,
  isIdentitySsoSessionMessage,
} from '@webonone/platform-embed'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import {
  isWebsiteSsoSkipped,
  markWebsiteSsoSkipped,
} from '@/features/auth/utils/ssoPeerGuard'

const LOG = '[website-sso]'
const SILENT_SSO_TIMEOUT_MS = 4000

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

type SilentSsoState = {
  isChecking: boolean
  iframeSrc: string | null
}

/**
 * Guest website SSO via a hidden Identity iframe only.
 * Never hops to the WebOnOne app — login stays on this origin.
 */
export function useWebsiteSilentSso(): SilentSsoState {
  const { isAuthenticated, login, ssoProbeEpoch } = useWebsiteAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isAuthRoute = location.pathname.startsWith('/auth/')
  const isLoginRoute = location.pathname === '/login'
  const hasAuthCode = Boolean(searchParams.get('code'))
  const promptLogin = searchParams.get('prompt') === 'login'
  const shouldSkip =
    isAuthRoute ||
    isLoginRoute ||
    isAuthenticated ||
    hasAuthCode ||
    promptLogin ||
    isWebsiteSsoSkipped()

  const [isChecking, setIsChecking] = useState(() => !shouldSkip)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const settledRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const lastProbeEpochRef = useRef(ssoProbeEpoch)

  useEffect(() => {
    console.log(LOG, 'silent-sso mount', {
      href: window.location.href,
      isAuthRoute,
      isLoginRoute,
      isAuthenticated,
      hasAuthCode,
      promptLogin,
      documentSkip: isWebsiteSsoSkipped(),
      shouldSkip,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount snapshot
  }, [])

  useEffect(() => {
    if (promptLogin) {
      markWebsiteSsoSkipped('prompt=login')
    }
  }, [promptLogin])

  useEffect(() => {
    if (ssoProbeEpoch === lastProbeEpochRef.current) {
      return
    }
    lastProbeEpochRef.current = ssoProbeEpoch
    if (shouldSkip) {
      return
    }
    console.log(LOG, 'probe epoch → re-run Identity silent', { ssoProbeEpoch })
    settledRef.current = false
    setIsChecking(true)
  }, [shouldSkip, ssoProbeEpoch])

  useEffect(() => {
    if (shouldSkip) {
      settledRef.current = true
      setIsChecking(false)
      setIframeSrc(null)
      return
    }

    settledRef.current = false
    const identityOrigin = normalizeOrigin(getIdentityOrigin())
    const parentOrigin = window.location.origin
    let cancelled = false

    function clearPhaseTimeout() {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    function settle(reason: string) {
      if (cancelled || settledRef.current) {
        return
      }
      settledRef.current = true
      clearPhaseTimeout()
      setIsChecking(false)
      setIframeSrc(null)
      console.log(LOG, 'Identity silent settle', { reason })
    }

    console.log(LOG, 'Identity silent iframe start', { identityOrigin, parentOrigin })
    setIframeSrc(buildIdentitySilentSsoUrl(identityOrigin, parentOrigin))
    setIsChecking(true)
    timeoutRef.current = window.setTimeout(() => settle('timeout'), SILENT_SSO_TIMEOUT_MS)

    function onMessage(event: MessageEvent) {
      if (normalizeOrigin(event.origin) !== identityOrigin) {
        return
      }
      if (isIdentitySsoSessionMessage(event.data)) {
        console.log(LOG, 'Identity silent → session', { userId: event.data.user.id })
        login({
          accessToken: event.data.accessToken,
          user: {
            id: event.data.user.id,
            email: event.data.user.email,
            displayName: event.data.user.displayName,
            avatarUrl: event.data.user.avatarUrl ?? null,
          },
        })
        settle('session')
        return
      }
      if (isIdentitySsoNoneMessage(event.data)) {
        settle('none')
      }
    }

    window.addEventListener('message', onMessage)
    return () => {
      cancelled = true
      window.removeEventListener('message', onMessage)
      clearPhaseTimeout()
      // Strict Mode remounts must not leave isChecking stuck true.
      setIframeSrc(null)
    }
  }, [login, shouldSkip, ssoProbeEpoch])

  return { isChecking, iframeSrc }
}
