import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell, LoadingState } from '@webonone/ui-kit'
import { QUERY, exchangeAuthCode, parseCoreReturnPath } from '@webonone/platform-nav'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'
import { buildWebOnOneLoginHref } from '../utils/buildWebOnOneLoginHref'
import { getIdentityApiBase } from '../utils/identityConfig'

/** Prevents duplicate exchange when React Strict Mode remounts the handoff page. */
const exchangedCodes = new Set<string>()

function getHandoffRedirectUri(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams)
  params.delete(QUERY.CODE)
  params.delete(QUERY.STATE)
  const search = params.toString()
  const path = '/auth/handoff'
  return `${window.location.origin}${search ? `${path}?${search}` : path}`
}

/**
 * Public route: adopt a website (or peer) auth-code into webonone_auth, then go home.
 * No OAuth state — redirectUri is the handoff URL minus code/state.
 */
export function AuthHandoffPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string | null>(null)
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) {
      return
    }
    handledRef.current = true

    const code = searchParams.get(QUERY.CODE)
    console.log('[webonone-auth]', 'handoff start', {
      href: window.location.href,
      hasCode: Boolean(code),
    })
    // Clear website-bridge pending so a later /login does not skip probing.
    try {
      sessionStorage.removeItem('webonone_website_sso_pending')
    } catch {
      // ignore
    }
    if (!code) {
      if (searchParams.get('sso_bridge') === 'done') {
        console.log('[webonone-auth]', 'handoff without code + sso_bridge=done → login')
        window.location.replace(`${window.location.origin}/login?sso_bridge=done`)
        return
      }
      setError(t('missingAuthResponse'))
      return
    }

    if (exchangedCodes.has(code)) {
      return
    }
    exchangedCodes.add(code)

    const returnPath =
      parseCoreReturnPath(searchParams.get(QUERY.RETURN_PATH)) ??
      parseCoreReturnPath(searchParams.get('returnPath')) ??
      '/'

    void exchangeAuthCode({
      identityApiBase: getIdentityApiBase(),
      code,
      redirectUri: getHandoffRedirectUri(searchParams),
    })
      .then((result) => {
        console.log('[webonone-auth]', 'handoff exchange success → login', {
          userId: result.user.id,
          returnPath,
        })
        dispatch(
          authActions.loginSuccess({
            accessToken: result.accessToken,
            user: {
              id: result.user.id,
              email: result.user.email,
              displayName: result.user.displayName,
              avatarUrl: result.user.avatarUrl ?? null,
            },
          }),
        )
        navigate(returnPath, { replace: true })
      })
      .catch((err: Error) => {
        console.error('[webonone-auth]', 'handoff exchange failed', err)
        exchangedCodes.delete(code)
        setError(err.message)
      })
  }, [dispatch, navigate, searchParams, t])

  return (
    <PageShell title={t('brand')}>
      <div className="flex flex-col items-center gap-4 py-12">
        {error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              className="text-sm text-primary underline-offset-4 hover:underline"
              onClick={() =>
                navigate(buildWebOnOneLoginHref(undefined, { promptLogin: true }), {
                  replace: true,
                })
              }
            >
              {t('backToSignIn')}
            </button>
          </>
        ) : (
          <LoadingState overlay label={t('completingSignIn')} />
        )}
      </div>
    </PageShell>
  )
}
