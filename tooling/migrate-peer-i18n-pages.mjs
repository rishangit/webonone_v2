import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

function write(rel, body) {
  fs.writeFileSync(path.join(root, rel), body)
  console.log('W', rel)
}

function loginPage() {
  return `import { useEffect } from 'react'
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
`
}

for (const svc of ['data', 'email', 'media', 'sms', 'payment', 'design']) {
  write(`${svc}/frontend/src/features/auth/pages/LoginPage.tsx`, loginPage())
}

// Data dashboard
write(
  'data/frontend/src/features/dashboard/pages/DashboardPage.tsx',
  `import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Card, CardContent, CardHeader, CardTitle, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { dashboardActions } from '@/features/dashboard/store'

const ENTITY_LINKS: { key: string; labelKey: string; path: string }[] = [
  { key: 'tags', labelKey: 'tags:title', path: '/tags' },
  { key: 'units', labelKey: 'units:title', path: '/units' },
  { key: 'attributes', labelKey: 'attributes:title', path: '/attributes' },
  { key: 'products', labelKey: 'products:title', path: '/products' },
  { key: 'services', labelKey: 'services:title', path: '/services' },
  { key: 'spaces', labelKey: 'spaces:title', path: '/spaces' },
]

export function DashboardPage() {
  const { t } = useTranslation('shell')
  const { t: tAny } = useTranslation()
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { stats, status, error } = useAppSelector((s) => s.dashboard)
  const loading = status === 'loading' && !stats
  usePlatformLoading(loading ? t('loadingDashboard') : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(dashboardActions.loadStatsRequested())
  }, [accessToken, dispatch])

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage title={t('dashboard')} description={t('dashboardDescription')}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENTITY_LINKS.map((entity) => {
            const counts = stats?.counts[entity.key] ?? { verified: 0, pending: 0 }
            return (
              <Link key={entity.key} to={entity.path} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tAny(entity.labelKey)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>{t('verifiedCount', { count: counts.verified })}</p>
                    <p>{t('unverifiedCount', { count: counts.pending })}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : null}
    </FeaturePage>
  )
}
`,
)

// Payment dashboard
write(
  'payment/frontend/src/features/dashboard/pages/DashboardPage.tsx',
  `import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import type { PaymentRole } from '@/features/auth/types/auth.types'
import { dashboardActions } from '@/features/dashboard/store'
import { formatLkr } from '@/shared/utils/money'

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { t } = useTranslation('shell')
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { summary, status, error } = useAppSelector((s) => s.dashboard)
  const role: PaymentRole = user?.role ?? 'member'

  useEffect(() => {
    if (!accessToken) return
    dispatch(dashboardActions.loadSummaryRequested())
  }, [accessToken, dispatch])

  usePlatformLoading(status === 'loading' && !summary ? t('loadingDashboard') : null)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (role === 'member') {
    return (
      <FeaturePage title={t('dashboard')}>
        <Alert>
          <AlertDescription>{t('memberDenied')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage title={t('dashboard')} description={t('dashboardDescription')}>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t('activeCompanies')} value={summary?.activeCompaniesCount ?? '—'} />
        <StatCard title={t('issued')} value={summary?.issuedCount ?? '—'} />
        <StatCard title={t('pendingReview')} value={summary?.pendingVerificationCount ?? '—'} />
        <StatCard title={t('overdue')} value={summary?.overdueCount ?? '—'} />
        <StatCard title={t('paid')} value={summary?.paidCount ?? '—'} />
        <StatCard title={t('void')} value={summary?.voidCount ?? '—'} />
        <StatCard
          title={t('outstanding')}
          value={summary ? formatLkr(summary.outstandingAmountMinor) : '—'}
        />
      </div>
    </FeaturePage>
  )
}
`,
)

console.log('pages written')
