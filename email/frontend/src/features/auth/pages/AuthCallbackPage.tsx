import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  LoadingState,
  PageShell,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '../store/authSlice'
import type { UserProfile } from '../types/auth.types'
import { consumeAuthState } from '../utils/buildIdentityLoginUrl'
import { getAuthCallbackUrl, getIdentityApiBase } from '../utils/identityConfig'
import { apiClient } from '@/shared/services/apiClient'

const exchangedCodes = new Set<string>()

export function AuthCallbackPage() {
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
      setError('Missing authorization response')
      return
    }

    if (exchangedCodes.has(code)) {
      return
    }
    exchangedCodes.add(code)

    const stored = consumeAuthState(state)
    if (!stored) {
      setError('Invalid or expired sign-in session')
      return
    }

    fetch(`${getIdentityApiBase()}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri: getAuthCallbackUrl() }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          accessToken?: string
          user?: UserProfile & { avatarUrl?: string | null }
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
              role: 'member',
            },
          }),
        )

        return apiClient<{ user: { role: UserProfile['role'] } }>('/me').then((me) => {
          dispatch(authActions.setUserRole(me.user.role))
          navigate(stored.returnPath || '/', { replace: true })
        })
      })
      .catch((err: Error) => {
        exchangedCodes.delete(code)
        setError(err.message)
      })
  }, [dispatch, navigate, searchParams])

  return (
    <PageShell title="Email">
      <div className="flex flex-col items-center gap-4 py-12">
        {error ? (
          <>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="link"
              className="px-0"
              onClick={() => navigate('/login', { replace: true })}
            >
              Back to sign in
            </Button>
          </>
        ) : (
          <LoadingState overlay label="Completing sign in…" />
        )}
      </div>
    </PageShell>
  )
}
