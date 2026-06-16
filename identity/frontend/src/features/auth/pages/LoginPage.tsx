import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { LoginForm } from '../components/LoginForm'
import { postAuthSuccess, useEmbedMode } from '../hooks/useEmbedMode'
import { withEmbedQuery } from '../utils/embedQuery'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const { isEmbed, parentOrigin } = useEmbedMode()
  const { accessToken, user, isLoading } = useAppSelector((s) => s.auth)
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current || isLoading || !accessToken || !user) return

    if (isEmbed && parentOrigin) {
      handledRef.current = true
      postAuthSuccess(parentOrigin, {
        accessToken,
        expiresIn: 900,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      })
    }
  }, [accessToken, user, isLoading, isEmbed, parentOrigin])

  const registerLink = withEmbedQuery('/register', searchParams)
  const forgotLink = withEmbedQuery('/forgot-password', searchParams)

  return (
    <AuthLayout
      title="Sign in"
      description="Enter your credentials to continue"
      variant={isEmbed ? 'minimal' : 'full'}
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
      {!isEmbed && accessToken && user ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Signed in as {user.displayName}
        </p>
      ) : null}
    </AuthLayout>
  )
}
