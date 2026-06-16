import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { RegisterForm } from '../components/RegisterForm'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { withEmbedQuery } from '../utils/embedQuery'

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const { isEmbed } = useEmbedMode()
  const { registrationComplete } = useAppSelector((s) => s.auth)
  const loginLink = withEmbedQuery('/login', searchParams)

  return (
    <AuthLayout
      title="Create account"
      description="Register for a new Identity account"
      variant={isEmbed ? 'minimal' : 'full'}
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
    </AuthLayout>
  )
}
