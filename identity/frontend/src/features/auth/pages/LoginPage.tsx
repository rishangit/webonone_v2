import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout, FeaturePage } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { LoginForm } from '../components/LoginForm'
import { usePromptLoginSessionClear } from '../hooks/usePromptLoginSessionClear'
import { useRedirectMode } from '../hooks/useRedirectMode'
import { completeAuthRedirect } from '../utils/completeAuthRedirect'
import { withRedirectQuery } from '../utils/redirectQuery'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const { isRedirect, redirectUri, state } = useRedirectMode()
  const { accessToken, user, isLoading, error } = useAppSelector((s) => s.auth)
  const handledRef = useRef(false)
  const promptLogin = searchParams.get('prompt') === 'login'
  const freshLoginAllowedRef = useRef(!promptLogin)
  const wasLoadingRef = useRef(false)

  usePromptLoginSessionClear()

  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && accessToken && user) {
      freshLoginAllowedRef.current = true
    }
    wasLoadingRef.current = isLoading
  }, [accessToken, isLoading, user])

  useEffect(() => {
    if (handledRef.current || isLoading || !accessToken || !user) return
    if (!freshLoginAllowedRef.current) return

    if (isRedirect && redirectUri && state) {
      handledRef.current = true
      completeAuthRedirect(accessToken, redirectUri, state).catch(() => {
        handledRef.current = false
      })
    }
  }, [accessToken, user, isLoading, isRedirect, redirectUri, state])

  const registerLink = withRedirectQuery('/register', searchParams)
  const forgotLink = withRedirectQuery('/forgot-password', searchParams)

  if (!isRedirect && accessToken && user) {
    return (
      <FeaturePage
        title={`Welcome, ${user.displayName}!`}
        description="You are signed in to Identity."
      >
        <p className="text-sm text-muted-foreground">
          <Link to="/profile" className="text-primary underline-offset-4 hover:underline">
            View your profile
          </Link>
        </p>
      </FeaturePage>
    )
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Enter your credentials to continue"
      variant="minimal"
      footer={
        <span>
          <Link to={registerLink} className="text-primary underline-offset-4 hover:underline">
            Create account
          </Link>
          {' · '}
          <Link to={forgotLink} className="text-primary underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </span>
      }
    >
      <div className="space-y-4">
        <GoogleSignInButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
        <LoginForm />
      </div>
      {isRedirect && accessToken && user && freshLoginAllowedRef.current ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Signed in as {user.displayName}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-center text-sm text-destructive">{error}</p> : null}
    </AuthLayout>
  )
}
