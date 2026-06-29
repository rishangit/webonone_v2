import { AuthLayout, Button, PageShell } from '@webonone/ui-kit'
import { buildIdentityLoginUrl } from '../utils/buildIdentityLoginUrl'

export function LoginPage() {
  function handleSignIn() {
    window.location.assign(buildIdentityLoginUrl('/'))
  }

  return (
    <PageShell title="Email">
      <AuthLayout
        title="Sign in to Email"
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
