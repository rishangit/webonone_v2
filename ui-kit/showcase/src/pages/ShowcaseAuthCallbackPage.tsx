import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AuthLayout, Button, PageShell, Spinner } from '@webonone/ui-kit'
import {
  buildShowcaseLoginUrl,
  consumeShowcaseAuthState,
  exchangeShowcaseAuthCode,
} from '@/features/auth/showcaseAuth'

const exchangedCodes = new Set<string>()

export function ShowcaseAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) {
      return
    }
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

    const stored = consumeShowcaseAuthState(state)
    if (!stored) {
      setError('Invalid or expired sign-in session')
      return
    }

    void exchangeShowcaseAuthCode(code)
      .then(() => {
        const target = stored.returnPath || '/#complex-controls'
        if (target.startsWith('/#')) {
          window.location.replace(`${window.location.origin}${target}`)
          return
        }
        navigate(target, { replace: true })
      })
      .catch((err: Error) => {
        exchangedCodes.delete(code)
        setError(err.message)
      })
  }, [navigate, searchParams])

  return (
    <PageShell title="UI Kit Showcase">
      <AuthLayout title="Signing in" variant="minimal">
        {error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button type="button" onClick={() => window.location.assign(buildShowcaseLoginUrl())}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">Completing sign in…</p>
          </div>
        )}
      </AuthLayout>
    </PageShell>
  )
}
