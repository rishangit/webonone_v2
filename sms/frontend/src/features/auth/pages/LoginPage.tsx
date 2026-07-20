import { useEffect } from 'react'
import { AuthLayout, Button, PageShell } from '@webonone/ui-kit'
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
    <PageShell title="SMS">
      <AuthLayout
        title="Sign in to SMS"
        description="You will be redirected to Identity to sign in securely."
        variant="minimal"
      >
        <Button className="w-full" onClick={handleSignIn}>
          Continue to sign in
        </Button>
      </AuthLayout>
    </PageShell>
  )
}
