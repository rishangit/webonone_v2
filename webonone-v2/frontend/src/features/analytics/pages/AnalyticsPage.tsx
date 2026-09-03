import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { canAccessCompanySession } from '@/features/session/utils/canAccessCompanySession'
import { formatLkr } from '@/shared/utils/formatMoney'
import { analyticsActions } from '@/features/analytics/store'
import { analyticsDateRange } from '@/features/analytics/utils/analyticsRange'
import type { AnalyticsRangeKey, NamedAmount, NamedCount } from '@/features/analytics/types/analytics.types'
import { ANALYTICS_RANGE_KEYS } from '@/features/analytics/schemas/analyticsRange'
import { AnalyticsStatCard } from '@/features/analytics/components/AnalyticsStatCard'
import { AnalyticsChartCard } from '@/features/analytics/components/AnalyticsChartCard'
import { AnalyticsLineChart } from '@/features/analytics/components/charts/AnalyticsLineChart'
import { AnalyticsPieChart } from '@/features/analytics/components/charts/AnalyticsPieChart'
import { AnalyticsBarChart } from '@/features/analytics/components/charts/AnalyticsBarChart'

const RANGE_KEYS = ANALYTICS_RANGE_KEYS

function hasPositive(values: Array<{ amount?: number; value?: number; count?: number; profit?: number }>): boolean {
  return values.some((item) => (item.amount ?? item.value ?? item.count ?? item.profit ?? 0) > 0)
}

function amountsToPie(items: NamedAmount[], labelOf: (key: string) => string) {
  return items.map((item) => ({ name: labelOf(item.key) || item.label, value: item.amount }))
}

function countsToPie(items: NamedCount[], labelOf: (key: string) => string) {
  return items.map((item) => ({ name: labelOf(item.key) || item.label, value: item.count }))
}

function amountsToBars(items: NamedAmount[]) {
  return items.map((item) => ({ name: item.label, value: item.amount }))
}

function countsToBars(items: NamedCount[], labelOf: (key: string) => string) {
  return items.map((item) => ({ name: labelOf(item.key) || item.label, value: item.count }))
}

export function AnalyticsPage() {
  const { t, i18n } = useTranslation('analytics')
  const dispatch = useAppDispatch()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const { company, platform, status, error, lastFetchedAt } = useAppSelector((s) => s.analytics)
  const [rangeKey, setRangeKey] = useState<AnalyticsRangeKey>('30d')
  const range = useMemo(() => analyticsDateRange(rangeKey), [rangeKey])

  const isSuperAdmin = activeRole === 'super_admin'
  const isCompanyAdmin = activeRole === 'company_admin'
  const hasCompany = canAccessCompanySession(activeRole, activeCompanyId)
  const showRevenue = isCompanyAdmin
  const kind = isSuperAdmin ? 'platform' : 'company'
  const sessionKey = `${activeRole ?? ''}:${activeCompanyId ?? ''}:${kind}:${range.from}:${range.to}`
  const awaitingFirstLoad =
    selectionComplete &&
    (isSuperAdmin || hasCompany) &&
    lastFetchedAt === null &&
    !error

  usePlatformLoading(awaitingFirstLoad || status === 'loading' ? t('loading') : null)

  useEffect(() => {
    if (!selectionComplete) return
    if (isSuperAdmin) {
      dispatch(
        analyticsActions.loadRequested({
          kind: 'platform',
          from: range.from,
          to: range.to,
          sessionKey,
        }),
      )
      return
    }
    if (!hasCompany) return
    dispatch(
      analyticsActions.loadRequested({
        kind: 'company',
        from: range.from,
        to: range.to,
        sessionKey,
      }),
    )
  }, [selectionComplete, isSuperAdmin, hasCompany, range.from, range.to, sessionKey, dispatch])

  const rangeSelect = (
    <Select value={rangeKey} onValueChange={(value) => setRangeKey(value as AnalyticsRangeKey)}>
      <SelectTrigger className="w-48" aria-label={t('range.aria')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_KEYS.map((key) => (
          <SelectItem key={key} value={key}>
            {t(`range.${key}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (selectionComplete && !isSuperAdmin && !hasCompany) {
    return (
      <FeaturePage title={t('title')} description={t('description')} actions={rangeSelect}>
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (isSuperAdmin) {
    return (
      <FeaturePage title={t('title')} description={t('platformDescription')} actions={rangeSelect}>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnalyticsStatCard title={t('kpis.companies')} value={platform?.kpis.companyCount ?? '—'} />
          <AnalyticsStatCard title={t('kpis.staff')} value={platform?.kpis.staffCount ?? '—'} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnalyticsChartCard
            title={t('charts.companiesByStatus')}
            emptyLabel={platform && hasPositive(platform.companiesByStatus) ? null : t('emptyChart')}
          >
            <AnalyticsPieChart
              data={countsToPie(platform?.companiesByStatus ?? [], (key) => t(`progress.${key}`))}
              formatValue={(value) => String(value)}
            />
          </AnalyticsChartCard>
          <AnalyticsChartCard
            title={t('charts.companiesOverTime')}
            emptyLabel={platform && hasPositive(platform.companiesOverTime) ? null : t('emptyChart')}
          >
            <AnalyticsLineChart
              data={platform?.companiesOverTime ?? []}
              valueLabel={t('value.count')}
              language={i18n.language}
            />
          </AnalyticsChartCard>
        </div>
      </FeaturePage>
    )
  }

  const catalogMix = amountsToPie(company?.revenueByKind ?? [], (key) => t(`kind.${key}`))
  const paymentMix = amountsToPie(company?.revenueByPaymentMethod ?? [], (key) => t(`payment.${key}`))
  const runStatus = countsToPie(company?.eventRunStatus ?? [], (key) => t(`runStatus.${key}`))
  const tokenBars = countsToBars(company?.tokenStatus ?? [], (key) => t(`tokenStatus.${key}`))

  return (
    <FeaturePage title={t('title')} description={t('description')} actions={rangeSelect}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showRevenue ? (
          <>
            <AnalyticsStatCard
              title={t('kpis.revenue')}
              value={company ? formatLkr(company.kpis.revenueTotal) : '—'}
            />
            <AnalyticsStatCard
              title={t('kpis.profit')}
              value={company ? formatLkr(company.kpis.profitTotal) : '—'}
            />
            <AnalyticsStatCard title={t('kpis.sales')} value={company?.kpis.saleCount ?? '—'} />
            <AnalyticsStatCard title={t('kpis.customers')} value={company?.kpis.uniqueCustomers ?? '—'} />
          </>
        ) : null}
        <AnalyticsStatCard title={t('kpis.staff')} value={company?.kpis.staffCount ?? '—'} />
        <AnalyticsStatCard title={t('kpis.products')} value={company?.kpis.productCount ?? '—'} />
        <AnalyticsStatCard title={t('kpis.services')} value={company?.kpis.serviceCount ?? '—'} />
        <AnalyticsStatCard title={t('kpis.spaces')} value={company?.kpis.spaceCount ?? '—'} />
        <AnalyticsStatCard title={t('kpis.occurrences')} value={company?.kpis.occurrenceCount ?? '—'} />
        <AnalyticsStatCard title={t('kpis.checkIns')} value={company?.kpis.checkInCount ?? '—'} />
        <AnalyticsStatCard
          title={t('progress.title')}
          value={company ? t(`progress.${company.companyProgress.status}`) : '—'}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {showRevenue ? (
          <>
            <AnalyticsChartCard
              title={t('charts.revenueOverTime')}
              emptyLabel={company && hasPositive(company.revenueOverTime) ? null : t('emptyChart')}
            >
              <AnalyticsLineChart
                data={company?.revenueOverTime ?? []}
                valueLabel={t('value.revenue')}
                profitLabel={t('value.profit')}
                formatValue={formatLkr}
                language={i18n.language}
              />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title={t('charts.revenueByKind')}
              emptyLabel={hasPositive(catalogMix) ? null : t('emptyChart')}
            >
              <AnalyticsPieChart data={catalogMix} formatValue={formatLkr} />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title={t('charts.revenueByPayment')}
              emptyLabel={hasPositive(paymentMix) ? null : t('emptyChart')}
            >
              <AnalyticsPieChart data={paymentMix} formatValue={formatLkr} />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title={t('charts.topProducts')}
              emptyLabel={
                company && hasPositive(company.topItems.product) ? null : t('emptyChart')
              }
            >
              <AnalyticsBarChart
                data={amountsToBars(company?.topItems.product ?? [])}
                valueLabel={t('value.revenue')}
                formatValue={formatLkr}
              />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title={t('charts.topServices')}
              emptyLabel={
                company && hasPositive(company.topItems.service) ? null : t('emptyChart')
              }
            >
              <AnalyticsBarChart
                data={amountsToBars(company?.topItems.service ?? [])}
                valueLabel={t('value.revenue')}
                formatValue={formatLkr}
              />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title={t('charts.topSpaces')}
              emptyLabel={company && hasPositive(company.topItems.space) ? null : t('emptyChart')}
            >
              <AnalyticsBarChart
                data={amountsToBars(company?.topItems.space ?? [])}
                valueLabel={t('value.revenue')}
                formatValue={formatLkr}
              />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title={t('charts.topCustomers')}
              emptyLabel={company && hasPositive(company.topCustomers) ? null : t('emptyChart')}
            >
              <AnalyticsBarChart
                data={amountsToBars(company?.topCustomers ?? [])}
                valueLabel={t('value.revenue')}
                formatValue={formatLkr}
              />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title={t('charts.salesByStaff')}
              emptyLabel={company && hasPositive(company.salesByStaff) ? null : t('emptyChart')}
            >
              <AnalyticsBarChart
                data={amountsToBars(company?.salesByStaff ?? [])}
                valueLabel={t('value.revenue')}
                formatValue={formatLkr}
              />
            </AnalyticsChartCard>
          </>
        ) : null}

        <AnalyticsChartCard
          title={t('charts.eventRunStatus')}
          emptyLabel={hasPositive(runStatus) ? null : t('emptyChart')}
        >
          <AnalyticsPieChart data={runStatus} />
        </AnalyticsChartCard>
        <AnalyticsChartCard
          title={t('charts.tokenStatus')}
          emptyLabel={hasPositive(tokenBars) ? null : t('emptyChart')}
        >
          <AnalyticsBarChart
            data={tokenBars}
            valueLabel={t('value.count')}
            layout="horizontal"
          />
        </AnalyticsChartCard>
        <AnalyticsChartCard
          title={t('charts.checkInsOverTime')}
          emptyLabel={company && hasPositive(company.checkInsOverTime) ? null : t('emptyChart')}
        >
          <AnalyticsLineChart
            data={company?.checkInsOverTime ?? []}
            valueLabel={t('value.count')}
            language={i18n.language}
          />
        </AnalyticsChartCard>
      </div>
    </FeaturePage>
  )
}
