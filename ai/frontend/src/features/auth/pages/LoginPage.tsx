import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthLayout, Button, PageShell } from '@webonone/ui-kit'
import { buildIdentityLoginUrl } from '../utils/buildIdentityLoginUrl'

const LOGIN_RETURN_PATH = '/'

export function LoginPage() {
  const { t } = useTranslation('shell')

  useEffect(() => {
    window.location.assign(buildIdentityLoginUrl(LOGIN_RETURN_PATH))
  }, [])

  function handleSignIn() {
    window.location.assign(buildIdentityLoginUrl(LOGIN_RETURN_PATH))
  }

  return (
    <PageShell title={t('brand')}>
      <AuthLayout
        title={t('signInTitle')}
        description={t('signInDescription')}
        variant="minimal"
      >
        <Button className="w-full" onClick={handleSignIn}>
          {t('continueToSignIn')}
        </Button>
      </AuthLayout>
    </PageShell>
  )
}
