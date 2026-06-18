import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { RegisterForm } from '../components/RegisterForm'
import { useRedirectMode } from '../hooks/useRedirectMode'
import { completeAuthRedirect } from '../utils/completeAuthRedirect'
import { withRedirectQuery } from '../utils/redirectQuery'

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const { isRedirect, redirectUri, state } = useRedirectMode()
  const { registrationComplete, accessToken, user, isLoading, error } = useAppSelector((s) => s.auth)
  const handledRef = useRef(false)
  const loginLink = withRedirectQuery('/login', searchParams)

  useEffect(() => {
    if (handledRef.current || isLoading || !accessToken || !user) return

    if (isRedirect && redirectUri && state) {
      handledRef.current = true
      completeAuthRedirect(accessToken, redirectUri, state).catch(() => {
        handledRef.current = false
      })
    }
  }, [accessToken, user, isLoading, isRedirect, redirectUri, state])

  return (
    <AuthLayout
      title="Create account"
      description="Register for a new Identity account"
      variant="minimal"
      footer={
        <Link to={loginLink} className="text-primary underline-offset-4 hover:underline">
          Already have an account? Sign in
        </Link>
      }
    >
      {registrationComplete ? (
        <p className="text-center text-sm text-muted-foreground">
          Account created.{' '}
          <Link to={loginLink} className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          <GoogleSignInButton />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
            </div>
          </div>
          <RegisterForm />
        </div>
      )}
      {!isRedirect && accessToken && user ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Signed in as {user.displayName}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-center text-sm text-destructive">{error}</p> : null}
    </AuthLayout>
  )
}
