import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Body,
  Button,
  Card,
  FeatureScreen,
  Heading,
  Muted,
  Spinner,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/features/auth/SessionContext'
import {
  smsAdminApi,
  type SmsDashboardStats,
  type TextLkBalance,
} from '@/shared/services/smsAdminApi'

function formatRelativeUpdated(iso: string | null | undefined): string | null {
  if (!iso) return null
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return null
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 45) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`
  }
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) {
    return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`
  }
  const diffDay = Math.floor(diffHr / 24)
  return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="flex-1 min-w-[40%] p-4">
      <Muted className="text-sm">{title}</Muted>
      <Heading className="mt-1 text-2xl">{value}</Heading>
    </Card>
  )
}

export function DashboardScreen() {
  const { t, i18n } = useTranslation('smsShell')
  const router = useRouter()
  const { user } = useSession()
  const canViewCredits = user?.role === 'super_admin' || user?.role === 'company_admin'

  const [stats, setStats] = useState<SmsDashboardStats | null>(null)
  const [credits, setCredits] = useState<TextLkBalance | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [creditsError, setCreditsError] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingCredits, setLoadingCredits] = useState(canViewCredits)

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      setStats(await smsAdminApi.getDashboardStats())
      setStatsError(null)
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadCredits = useCallback(async (force = false) => {
    if (!canViewCredits) return
    setLoadingCredits(true)
    try {
      setCredits(await smsAdminApi.getTextLkBalance({ force }))
      setCreditsError(null)
    } catch (err) {
      setCreditsError(err instanceof Error ? err.message : t('smsCreditsError'))
      setCredits(null)
    } finally {
      setLoadingCredits(false)
    }
  }, [canViewCredits, t])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadCredits()
  }, [loadCredits])

  const relative = formatRelativeUpdated(credits?.lastUpdated)
  const formattedBalance =
    credits?.configured && credits.balance != null
      ? credits.balance.toLocaleString(i18n.language === 'si' ? 'si-LK' : 'en-US')
      : null

  return (
    <FeatureScreen title={t('dashboard')} description={t('dashboardDescription')}>
      {loadingStats && !stats ? <Spinner label={t('loadingDashboard')} /> : null}
      {statsError ? <Body className="text-destructive">{statsError}</Body> : null}

      {stats ? (
        <View className="flex-row flex-wrap gap-3">
          <StatCard title={t('queuePending')} value={stats.pendingCount} />
          <StatCard title={t('failed24h')} value={stats.failedCount24h} />
          <StatCard title={t('sent24h')} value={stats.sentCount24h} />
          {stats.gatewayMode === 'text_lk' ? (
            <StatCard
              title={t('gatewayMode')}
              value={stats.gatewayConfigured ? t('gatewayTextLk') : t('gatewayTextLkNotReady')}
            />
          ) : (
            <StatCard title={t('approvedDevices')} value={stats.approvedDevices} />
          )}
        </View>
      ) : null}

      {canViewCredits ? (
        <Card className="mt-4 gap-2 p-4">
          <View className="flex-row items-start justify-between gap-2">
            <Muted className="text-sm">{t('smsCreditsTitle')}</Muted>
            {credits?.configured || creditsError ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={loadingCredits}
                onPress={() => void loadCredits(true)}
              >
                {t('smsCreditsRefresh')}
              </Button>
            ) : null}
          </View>

          {loadingCredits && !credits && !creditsError ? (
            <Spinner label={t('smsCreditsLoading')} />
          ) : null}

          {creditsError ? (
            <>
              <Body>{t('smsCreditsError')}</Body>
              <Button size="sm" variant="outline" onPress={() => void loadCredits(true)}>
                {t('smsCreditsRetry')}
              </Button>
            </>
          ) : null}

          {!creditsError && credits?.configured === false ? (
            <>
              <Body>{t('smsCreditsNotConfigured')}</Body>
              <Button size="sm" variant="outline" onPress={() => router.push('/sms/devices')}>
                {t('smsCreditsConfigure')}
              </Button>
            </>
          ) : null}

          {!creditsError && formattedBalance != null ? (
            <>
              <Heading className="text-3xl tabular-nums">{formattedBalance}</Heading>
              <Muted>{t('smsCreditsRemaining')}</Muted>
              <Muted className="text-xs">{t('gatewayTextLk')}</Muted>
              {relative ? (
                <Muted className="text-xs">{t('smsCreditsLastUpdated', { relative })}</Muted>
              ) : null}
            </>
          ) : null}
        </Card>
      ) : null}
    </FeatureScreen>
  )
}
