import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  buildIdentitySilentSsoUrl,
  isIdentitySsoNoneMessage,
  isIdentitySsoSessionMessage,
} from '@webonone/platform-embed'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'

const SILENT_SSO_TIMEOUT_MS = 4000

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

type SilentSsoState = {
  /** True while waiting for the Identity SSO iframe reply (or timeout). */
  isChecking: boolean
  /** Iframe src when a silent check is in progress; null otherwise. */
  iframeSrc: string | null
}

/**
 * When the website has no local session, ask Identity (hidden iframe) whether
 * a platform session exists and adopt that JWT via postMessage.
 * Skips when `prompt=login` (post-logout) so Logout is not immediately undone.
 * Runs at most once per page load.
 */
export function useWebsiteSilentSso(): SilentSsoState {
  const { isAuthenticated, login } = useWebsiteAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const hasAuthCode = Boolean(searchParams.get('code'))
  const promptLogin = searchParams.get('prompt') === 'login'
  const [isChecking, setIsChecking] = useState(
    () => !isAuthenticated && !hasAuthCode && !promptLogin,
  )
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const settledRef = useRef(false)
  const strippedPromptRef = useRef(false)
  /** Allows a single silent attempt; stays false after logout / prompt=login. */
  const allowSilentRef = useRef(!isAuthenticated && !hasAuthCode && !promptLogin)

  // After logout land with prompt=login: skip SSO, then strip prompt from the URL.
  useEffect(() => {
    if (!promptLogin || strippedPromptRef.current) {
      return
    }
    strippedPromptRef.current = true
    allowSilentRef.current = false
    settledRef.current = true
    setIsChecking(false)
    setIframeSrc(null)

    const next = new URLSearchParams(searchParams)
    next.delete('prompt')
    const search = next.toString()
    navigate(
      { pathname: window.location.pathname, search: search ? `?${search}` : '' },
      { replace: true },
    )
  }, [navigate, promptLogin, searchParams])

  useEffect(() => {
    if (isAuthenticated || hasAuthCode || promptLogin) {
      allowSilentRef.current = false
      settledRef.current = true
      setIsChecking(false)
      setIframeSrc(null)
      return
    }

    if (!allowSilentRef.current) {
      setIsChecking(false)
      setIframeSrc(null)
      return
    }

    allowSilentRef.current = false
    settledRef.current = false
    const identityOrigin = normalizeOrigin(getIdentityOrigin())
    const parentOrigin = window.location.origin
    setIframeSrc(buildIdentitySilentSsoUrl(identityOrigin, parentOrigin))
    setIsChecking(true)

    function settle() {
      if (settledRef.current) {
        return
      }
      settledRef.current = true
      setIsChecking(false)
      setIframeSrc(null)
    }

    function onMessage(event: MessageEvent) {
      if (normalizeOrigin(event.origin) !== identityOrigin) {
        return
      }

      if (isIdentitySsoSessionMessage(event.data)) {
        login({
          accessToken: event.data.accessToken,
          user: {
            id: event.data.user.id,
            email: event.data.user.email,
            displayName: event.data.user.displayName,
            avatarUrl: event.data.user.avatarUrl ?? null,
          },
        })
        settle()
        return
      }

      if (isIdentitySsoNoneMessage(event.data)) {
        settle()
      }
    }

    window.addEventListener('message', onMessage)
    const timeoutId = window.setTimeout(settle, SILENT_SSO_TIMEOUT_MS)

    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timeoutId)
    }
  }, [hasAuthCode, isAuthenticated, login, promptLogin])

  return { isChecking, iframeSrc }
}
