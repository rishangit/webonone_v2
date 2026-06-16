import { PageShell } from '@webonone/ui-kit'
import { IdentityLoginFrame } from '../components/IdentityLoginFrame'

const LOGIN_URL =
  import.meta.env.VITE_IDENTITY_LOGIN_URL ?? 'http://localhost:3001/login'

export function LoginPage() {
  return (
    <PageShell title="WebOnOne">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold">Sign in to WebOnOne</h1>
        <p className="text-sm text-muted-foreground">
          Authentication is handled securely by Identity
        </p>
        <IdentityLoginFrame
          loginUrl={LOGIN_URL}
          parentOrigin={window.location.origin}
          returnPath="/"
        />
      </div>
    </PageShell>
  )
}
