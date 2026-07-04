import { useEffect } from 'react'
import { PageShell, Button } from '@webonone/ui-kit'
import { buildIdentityLoginUrl } from '../utils/buildIdentityLoginUrl'

const LOGIN_RETURN_PATH = '/'

export function LoginPage() {
  useEffect(() => {
    window.location.assign(buildIdentityLoginUrl(LOGIN_RETURN_PATH))
  }, [])

  function handleSignIn() {
    window.location.assign(buildIdentityLoginUrl(LOGIN_RETURN_PATH))
  }

  return (
    <PageShell title="WebOnOne">
      <div className="flex flex-col items-center gap-4 py-12">
        <h1 className="text-2xl font-semibold">Sign in to WebOnOne</h1>
        <p className="text-sm text-muted-foreground">
          You will be redirected to Identity to sign in securely.
        </p>
        <Button onClick={handleSignIn}>Continue to sign in</Button>
      </div>
    </PageShell>
  )
}
