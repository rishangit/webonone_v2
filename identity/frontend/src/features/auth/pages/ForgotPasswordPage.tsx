import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@webonone/ui-kit'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { withRedirectQuery } from '../utils/redirectQuery'

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const loginLink = withRedirectQuery('/login', searchParams)

  return (
    <AuthLayout
      title={t('forgotPasswordTitle')}
      description={t('forgotPasswordDescription')}
      variant="minimal"
      footer={
        <Link to={loginLink} className="text-primary underline-offset-4 hover:underline">
          {t('backToSignIn')}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
