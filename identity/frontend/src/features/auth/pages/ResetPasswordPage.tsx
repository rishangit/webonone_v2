import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import { EmbedAuthLink } from '../components/EmbedAuthLink'
import { useEmbedAuthNavigate } from '../hooks/useEmbedAuthNavigate'
import { clearResetSessionToken } from '../utils/resetSessionStorage'
import { withPromptLoginRedirectQuery } from '../utils/redirectQuery'

export function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const { navigateAuth } = useEmbedAuthNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { resetPasswordComplete } = useAppSelector((s) => s.auth)
  const tokenFromQuery = searchParams.get('token') ?? ''
  const resetSessionToken =
    (location.state as { resetSessionToken?: string } | null)?.resetSessionToken ?? null
  const loginLink = withPromptLoginRedirectQuery('/login', searchParams)

  useEffect(() => {
    if (resetPasswordComplete) {
      clearResetSessionToken()
      navigateAuth(loginLink, { replace: true })
    }
  }, [resetPasswordComplete, loginLink, navigateAuth])

  return (
    <AuthLayout
      title={t('resetPassword')}
      description={t('resetPasswordDescription')}
      variant="minimal"
      footer={
        <EmbedAuthLink to={loginLink} className="text-primary underline-offset-4 hover:underline">
          {t('backToSignIn')}
        </EmbedAuthLink>
      }
    >
      <ResetPasswordForm resetSessionToken={resetSessionToken} legacyToken={tokenFromQuery} />
    </AuthLayout>
  )
}
