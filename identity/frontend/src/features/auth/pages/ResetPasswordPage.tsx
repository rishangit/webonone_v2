import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import { withRedirectQuery } from '../utils/redirectQuery'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPasswordComplete } = useAppSelector((s) => s.auth)
  const tokenFromQuery = searchParams.get('token') ?? ''
  const loginLink = withRedirectQuery('/login', searchParams)

  useEffect(() => {
    if (resetPasswordComplete) {
      navigate(loginLink, { replace: true })
    }
  }, [resetPasswordComplete, loginLink, navigate])

  return (
    <AuthLayout
      title="Reset password"
      description="Enter your reset token and new password"
      variant="minimal"
      footer={
        <Link to={loginLink} className="text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm initialToken={tokenFromQuery} />
    </AuthLayout>
  )
}
