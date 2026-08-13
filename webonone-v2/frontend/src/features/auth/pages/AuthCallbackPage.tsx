import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell, LoadingState } from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'
import type { UserProfile } from '../types/auth.types'
import { consumeAuthState } from '../utils/buildIdentityLoginUrl'
import { buildWebOnOneLoginHref } from '../utils/buildWebOnOneLoginHref'
import { getAuthCallbackUrl, getIdentityApiBase } from '../utils/identityConfig'

/** Prevents duplicate exchange when React Strict Mode remounts the callback page. */
const exchangedCodes = new Set<string>()

export function AuthCallbackPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string | null>(null)
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      setError(t('callback.missingAuthorization'))
      return
    }

    if (exchangedCodes.has(code)) {
      return
    }
    exchangedCodes.add(code)

    const stored = consumeAuthState(state)
    if (!stored) {
      setError(t('callback.invalidOrExpired'))
      return
    }

    const redirectUri = getAuthCallbackUrl()

    fetch(`${getIdentityApiBase()}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          accessToken?: string
          user?: UserProfile
          message?: string
        }
        if (!res.ok || !data.accessToken || !data.user) {
          throw new Error(data.message ?? `Token exchange failed (${res.status})`)
        }

        dispatch(
          authActions.loginSuccess({
            accessToken: data.accessToken,
            user: {
              id: data.user.id,
              email: data.user.email,
              displayName: data.user.displayName,
              avatarUrl: data.user.avatarUrl ?? null,
              locale: data.user.locale ?? null,
            },
          }),
        )
        const targetPath = stored.returnPath || '/'
        navigate(targetPath, { replace: true })
      })
      .catch((err: Error) => {
        exchangedCodes.delete(code)
        setError(err.message)
      })
  }, [dispatch, navigate, searchParams, t])

  return (
    <PageShell title={t('callback.pageTitle')}>
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
              {t('callback.backToSignIn')}
            </button>
          </>
        ) : (
          <LoadingState overlay label={t('callback.completing')} />
        )}
      </div>
    </PageShell>
  )
}
