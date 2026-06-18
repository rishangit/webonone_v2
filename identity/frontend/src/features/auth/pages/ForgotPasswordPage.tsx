import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@webonone/ui-kit'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { withRedirectQuery } from '../utils/redirectQuery'

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const loginLink = withRedirectQuery('/login', searchParams)

  return (
    <AuthLayout
      title="Forgot password"
      description="We'll send you a reset link if the email exists"
      variant="minimal"
      footer={
        <Link to={loginLink} className="text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
