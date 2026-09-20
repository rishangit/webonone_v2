import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Alert,
  AlertDescription,
  FeatureScreen,
  NativeSelect,
  Spinner,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { normalizeLocale } from '@webonone/i18n'
import { useSession } from '@/features/auth/SessionContext'
import { AnalyticsChartCard } from '@/features/analytics/components/AnalyticsChartCard'
import { AnalyticsStatCard } from '@/features/analytics/components/AnalyticsStatCard'
import { AnalyticsBarChart } from '@/features/analytics/components/charts/AnalyticsBarChart'
import { AnalyticsLineChart } from '@/features/analytics/components/charts/AnalyticsLineChart'
import { AnalyticsPieChart } from '@/features/analytics/components/charts/AnalyticsPieChart'
import { ANALYTICS_RANGE_KEYS } from '@/features/analytics/schemas/analyticsRange'
import { companyAnalyticsApi } from '@/features/analytics/services/companyAnalyticsApi'
import type {
  AnalyticsRangeKey,
  CompanyAnalytics,
  NamedAmount,
  NamedCount,
  PlatformAnalytics,
} from '@/features/analytics/types/analytics.types'
import { analyticsDateRange } from '@/features/analytics/utils/analyticsRange'
import { canAccessCompanySession } from '@/features/analytics/utils/canAccessCompanySession'
import { formatLkr } from '@/features/analytics/utils/formatMoney'

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

export function AnalyticsScreen() {
  const { user } = useSession()
  const { t, i18n } = useTranslation('analytics')
  const locale = normalizeLocale(i18n.language)
  const [rangeKey, setRangeKey] = useState<AnalyticsRangeKey>('30d')
  const range = useMemo(() => analyticsDateRange(rangeKey), [rangeKey])
  const [company, setCompany] = useState<CompanyAnalytics | null>(null)
  const [platform, setPlatform] = useState<PlatformAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const isSuperAdmin = user?.role === 'super_admin'
  const showRevenue = user?.role === 'company_admin'
  const hasCompany = canAccessCompanySession(user?.role, user?.companyId)

  useEffect(() => {
    if (!user) return
    if (!isSuperAdmin && !hasCompany) {
      setLoading(false)
      setError(null)
      return
    }

    let active = true
    setLoading(true)
    const request = isSuperAdmin
      ? companyAnalyticsApi.getPlatform(range.from, range.to)
      : companyAnalyticsApi.getCompany(range.from, range.to)

    void request
      .then((data) => {
        if (!active) return
        setError(null)
        if (isSuperAdmin) {
          setPlatform(data as PlatformAnalytics)
          setCompany(null)
        } else {
          setCompany(data as CompanyAnalytics)
          setPlatform(null)
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : t('failed'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [hasCompany, isSuperAdmin, range.from, range.to, t, user])

  const rangeSelect = (
    <View className="w-48">
      <NativeSelect
        label={t('range.aria')}
        value={rangeKey}
        onValueChange={(value) => setRangeKey(value as AnalyticsRangeKey)}
        options={ANALYTICS_RANGE_KEYS.map((key) => ({ value: key, label: t(`range.${key}`) }))}
        allowEmpty={false}
      />
    </View>
  )

  if (!user) return null

  if (!isSuperAdmin && !hasCompany) {
    return (
      <FeatureScreen title={t('title')} description={t('description')} actions={rangeSelect}>
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  if (isSuperAdmin) {
    return (
      <FeatureScreen title={t('title')} description={t('platformDescription')} actions={rangeSelect}>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {loading && !platform ? <Spinner label={t('loading')} /> : null}
        <View className="flex-row flex-wrap gap-3">
          <AnalyticsStatCard title={t('kpis.companies')} value={platform?.kpis.companyCount ?? '—'} />
          <AnalyticsStatCard title={t('kpis.staff')} value={platform?.kpis.staffCount ?? '—'} />
        </View>
        <View className="gap-3">
          <AnalyticsChartCard
            title={t('charts.companiesByStatus')}
            emptyLabel={platform && hasPositive(platform.companiesByStatus) ? null : t('emptyChart')}
          >
            <AnalyticsPieChart
              data={countsToPie(platform?.companiesByStatus ?? [], (key) =>
                t(`progress.${key}`, { defaultValue: key }),
              )}
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
              locale={locale}
              tapHint={t('tapPoint')}
            />
          </AnalyticsChartCard>
        </View>
      </FeatureScreen>
    )
  }

  const catalogMix = amountsToPie(company?.revenueByKind ?? [], (key) =>
    t(`kind.${key}`, { defaultValue: key }),
  )
  const paymentMix = amountsToPie(company?.revenueByPaymentMethod ?? [], (key) =>
    t(`payment.${key}`, { defaultValue: key }),
  )
  const runStatus = countsToPie(company?.eventRunStatus ?? [], (key) =>
    t(`runStatus.${key}`, { defaultValue: key }),
  )
  const tokenBars = countsToBars(company?.tokenStatus ?? [], (key) =>
    t(`tokenStatus.${key}`, { defaultValue: key }),
  )

  return (
    <FeatureScreen title={t('title')} description={t('description')} actions={rangeSelect}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading && !company ? <Spinner label={t('loading')} /> : null}

      <View className="flex-row flex-wrap gap-3">
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
      </View>

      <View className="gap-3">
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
                locale={locale}
                tapHint={t('tapPoint')}
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
              emptyLabel={company && hasPositive(company.topItems.product) ? null : t('emptyChart')}
            >
              <AnalyticsBarChart
                data={amountsToBars(company?.topItems.product ?? [])}
                valueLabel={t('value.revenue')}
                formatValue={formatLkr}
              />
            </AnalyticsChartCard>
            <AnalyticsChartCard
              title={t('charts.topServices')}
              emptyLabel={company && hasPositive(company.topItems.service) ? null : t('emptyChart')}
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
          <AnalyticsBarChart data={tokenBars} valueLabel={t('value.count')} layout="horizontal" />
        </AnalyticsChartCard>
        <AnalyticsChartCard
          title={t('charts.checkInsOverTime')}
          emptyLabel={company && hasPositive(company.checkInsOverTime) ? null : t('emptyChart')}
        >
          <AnalyticsLineChart
            data={company?.checkInsOverTime ?? []}
            valueLabel={t('value.count')}
            locale={locale}
            tapHint={t('tapPoint')}
          />
        </AnalyticsChartCard>
      </View>
    </FeatureScreen>
  )
}
