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
    <PageShell title="Data">
      <AuthLayout
        title="Sign in to Data"
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
