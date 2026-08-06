import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import { clearResetSessionToken } from '../utils/resetSessionStorage'
import { withRedirectQuery } from '../utils/redirectQuery'

export function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { resetPasswordComplete } = useAppSelector((s) => s.auth)
  const tokenFromQuery = searchParams.get('token') ?? ''
  const resetSessionToken =
    (location.state as { resetSessionToken?: string } | null)?.resetSessionToken ?? null
  const loginLink = withRedirectQuery('/login', searchParams)

  useEffect(() => {
    if (resetPasswordComplete) {
      clearResetSessionToken()
      navigate(loginLink, { replace: true })
    }
  }, [resetPasswordComplete, loginLink, navigate])

  return (
    <AuthLayout
      title={t('resetPassword')}
      description={t('resetPasswordDescription')}
      variant="minimal"
      footer={
        <Link to={loginLink} className="text-primary underline-offset-4 hover:underline">
          {t('backToSignIn')}
        </Link>
      }
    >
      <ResetPasswordForm resetSessionToken={resetSessionToken} legacyToken={tokenFromQuery} />
    </AuthLayout>
  )
}
