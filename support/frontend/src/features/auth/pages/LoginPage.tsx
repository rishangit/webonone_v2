import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout, Button, PageShell } from '@webonone/ui-kit'
import { buildIdentityLoginUrl } from '@/features/auth/utils/buildIdentityLoginUrl'

function normalizeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/')) {
    return '/feedback'
  }
  return value
}

export function LoginPage() {
  const { t } = useTranslation('shell')
  const [searchParams] = useSearchParams()
  const returnPath = useMemo(
    () => normalizeReturnPath(searchParams.get('return')),
    [searchParams],
  )

  useEffect(() => {
    window.location.assign(buildIdentityLoginUrl(returnPath))
  }, [returnPath])

  function handleSignIn() {
    window.location.assign(buildIdentityLoginUrl(returnPath))
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
