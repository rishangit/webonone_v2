import { PageShell, Button } from '@webonone/ui-kit'
import { buildIdentityLoginUrl } from '../utils/buildIdentityLoginUrl'

export function LoginPage() {
  function handleSignIn() {
    window.location.assign(buildIdentityLoginUrl('/library'))
  }

  return (
    <PageShell title="Media">
      <div className="flex flex-col items-center gap-4 py-12">
        <h1 className="text-2xl font-semibold">Sign in to Media</h1>
        <p className="text-sm text-muted-foreground">
          You will be redirected to Identity to sign in securely.
        </p>
        <Button onClick={handleSignIn}>Continue to sign in</Button>
      </div>
    </PageShell>
  )
}
