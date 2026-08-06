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
 * Used on `/login` (without prompt=login) so cold loads pick up SSO.
 */
export function useIdentitySilentSso(): SilentSsoState {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [searchParams] = useSearchParams()
  const promptLogin = searchParams.get('prompt') === 'login'
  const [isChecking, setIsChecking] = useState(() => !accessToken && !promptLogin)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const settledRef = useRef(false)
  const allowSilentRef = useRef(!accessToken && !promptLogin)

  useEffect(() => {
    if (accessToken || promptLogin) {
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
  }, [accessToken, dispatch, promptLogin])

  return { isChecking, iframeSrc }
}
