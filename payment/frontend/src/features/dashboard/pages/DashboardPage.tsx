import { useEffect } from 'react'
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
