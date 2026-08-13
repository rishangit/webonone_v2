import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  buildIdentitySilentSsoUrl,
  isIdentitySsoNoneMessage,
  isIdentitySsoSessionMessage,
} from '@webonone/platform-embed'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'

const LOG = '[webonone-auth]'
const SILENT_SSO_TIMEOUT_MS = 4000

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

type SilentSsoState = {
  isChecking: boolean
  iframeSrc: string | null
}

/**
 * When WebOnOne has no local session, ask Identity for an existing platform session.
 * Pass `enabled: false` while a website SSO bridge probe is still in flight.
 */
export function useIdentitySilentSso(options?: { enabled?: boolean }): SilentSsoState {
  const enabled = options?.enabled !== false
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [searchParams] = useSearchParams()
  const promptLogin = searchParams.get('prompt') === 'login'
  const canRun = enabled && !accessToken && !promptLogin
  const [isChecking, setIsChecking] = useState(() => canRun)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const settledRef = useRef(false)
  const allowSilentRef = useRef(canRun)
  const startedForEnabledRef = useRef(false)

  useEffect(() => {
    if (accessToken || promptLogin || !enabled) {
      allowSilentRef.current = false
      settledRef.current = true
      startedForEnabledRef.current = false
      setIsChecking(false)
      setIframeSrc(null)
      if (!enabled && !accessToken && !promptLogin) {
        console.log(LOG, 'Identity silent waiting (website bridge)')
      }
      return
    }

    // Re-arm when enabled flips true after website bridge.
    if (!startedForEnabledRef.current) {
      allowSilentRef.current = true
      settledRef.current = false
      startedForEnabledRef.current = true
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
    console.log(LOG, 'Identity silent start', { identityOrigin })
    setIframeSrc(buildIdentitySilentSsoUrl(identityOrigin, parentOrigin))
    setIsChecking(true)

    function settle(reason: string) {
      if (settledRef.current) {
        return
      }
      settledRef.current = true
      setIsChecking(false)
      setIframeSrc(null)
      console.log(LOG, 'Identity silent settle', { reason })
    }

    function onMessage(event: MessageEvent) {
      if (normalizeOrigin(event.origin) !== identityOrigin) {
        return
      }

      if (isIdentitySsoSessionMessage(event.data)) {
        console.log(LOG, 'Identity silent → session', { userId: event.data.user.id })
        dispatch(
          authActions.loginSuccess({
            accessToken: event.data.accessToken,
            user: {
              id: event.data.user.id,
              email: event.data.user.email,
              displayName: event.data.user.displayName,
              avatarUrl: event.data.user.avatarUrl ?? null,
              locale: event.data.user.locale ?? null,
            },
          }),
        )
        settle('session')
        return
      }

      if (isIdentitySsoNoneMessage(event.data)) {
        settle('none')
      }
    }

    window.addEventListener('message', onMessage)
    const timeoutId = window.setTimeout(() => settle('timeout'), SILENT_SSO_TIMEOUT_MS)

    return () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timeoutId)
    }
  }, [accessToken, dispatch, enabled, promptLogin])

  return { isChecking, iframeSrc }
}
