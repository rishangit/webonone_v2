import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthCancelMessage, isAuthNavigateMessage, isAuthSuccessMessage } from '@webonone/platform-embed'
import { normalizeLocale } from '@webonone/i18n'
import { useAppDispatch } from '@/app/store/hooks'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import { authActions } from '../store/authSlice'
import { getIdentityOrigin } from '../utils/identityConfig'
import { clearLoginReturnPath } from '../utils/loginReturnPath'
import { redirectToWebsiteWithAuthCode } from '../utils/redirectToWebsite'
import { getWebsiteHomepageUrl } from '../utils/websiteConfig'

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

type UseIdentityAuthMessageOptions = {
  returnPath?: string
  /** When set, after login hand the session back to the public website via auth code. */
  websiteReturnUrl?: string | null
  onCancel?: () => void
}

/**
 * Listen for Identity login iframe postMessage handoff.
 */
export function useIdentityAuthMessage({
  returnPath = '/',
  websiteReturnUrl = null,
  onCancel,
}: UseIdentityAuthMessageOptions = {}): void {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const handledRef = useRef(false)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    const identityOrigin = normalizeOrigin(getIdentityOrigin())

    function onMessage(event: MessageEvent) {
      if (normalizeOrigin(event.origin) !== identityOrigin) {
        return
      }

      if (isAuthSuccessMessage(event.data)) {
        if (handledRef.current) {
          return
        }
        handledRef.current = true
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

        if (event.data.user.locale) {
          void changeAppLocale(normalizeLocale(event.data.user.locale))
        }

        if (websiteReturnUrl) {
          void redirectToWebsiteWithAuthCode(event.data.accessToken, websiteReturnUrl)
            .then(() => {
              clearLoginReturnPath()
            })
            .catch(() => {
              // Prefer website home over WebOnOne `/` when website handoff fails.
              clearLoginReturnPath()
              window.location.assign(getWebsiteHomepageUrl())
            })
          return
        }

        clearLoginReturnPath()
        navigate(returnPath || '/', { replace: true })
        return
      }

      if (isAuthCancelMessage(event.data)) {
        onCancelRef.current?.()
        return
      }

      if (isAuthNavigateMessage(event.data)) {
        const search = event.data.search?.startsWith('?')
          ? event.data.search.slice(1)
          : event.data.search
        navigate({
          pathname: event.data.pathname,
          search: search || undefined,
        })
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [dispatch, navigate, returnPath, websiteReturnUrl])
}
