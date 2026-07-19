import { Alert, AlertDescription, Button } from '@webonone/ui-kit'
import { useShowcaseAccessToken } from '@/hooks/useShowcaseAccessToken'

/** Shared sign-in for live Select user + Select media embeds. */
export function ShowcaseLiveDemoAuthBanner() {
  const { isAuthenticated, signIn, signOut } = useShowcaseAccessToken()

  if (isAuthenticated) {
    return (
      <Alert>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>Signed in for live embeds. The same Identity JWT is passed to both pickers.</span>
          <Button type="button" variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>Sign in once with Identity to unlock live Select user and Select media.</span>
        <Button type="button" size="sm" onClick={signIn}>
          Sign in for live demos
        </Button>
      </AlertDescription>
    </Alert>
  )
}
