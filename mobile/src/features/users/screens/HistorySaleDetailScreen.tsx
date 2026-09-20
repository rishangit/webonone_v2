import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Card,
  FeatureScreen,
  Muted,
  ReadOnlyField,
  Spinner,
  StatusTag,
  Subheading,
} from '@webonone/mobile-ui'
import { getSaleHistoryDetail, type SaleHistoryDetail } from '@/features/users/services/userHistoryApi'
import { userDetailPath } from '@/features/users/utils/userPaths'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

function formatMoney(value: number, currency: string): string {
  return `${currency} ${value.toFixed(2)}`
}

type HistorySaleDetailScreenProps = {
  userId: string
  saleId: string
}

export function HistorySaleDetailScreen({ userId, saleId }: HistorySaleDetailScreenProps) {
  const { t } = useTranslation('users')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const [detail, setDetail] = useState<SaleHistoryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDetail(await getSaleHistoryDetail(saleId))
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : t('errors.loadHistoryDetailFailed'))
    } finally {
      setLoading(false)
    }
  }, [saleId, t])

  useEffect(() => {
    void load()
  }, [load])

  function handleBack() {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.push(userDetailPath(userId, 'history') as Href)
  }

  if (loading && !detail) {
    return (
      <FeatureScreen
        title={t('history.saleHistoryTitle')}
        description={t('history.saleDetailsTitle')}
        onBack={handleBack}
        backLabel={tc('back')}
      >
        <Spinner label={t('loading.history')} />
      </FeatureScreen>
    )
  }

  if (error && !detail) {
    return (
      <FeatureScreen
        title={t('history.saleHistoryTitle')}
        description={t('history.saleHistoryLoadError')}
        onBack={handleBack}
        backLabel={tc('back')}
      >
        <Body className="text-destructive">{error}</Body>
      </FeatureScreen>
    )
  }

  if (!detail) return null

  return (
    <FeatureScreen
      title={detail.billNumber}
      description={t('history.saleHistoryTitle')}
      onBack={handleBack}
      backLabel={tc('back')}
    >
      <View className="gap-6">
        <Card className="gap-3">
          <Subheading>{t('history.saleLinesTitle')}</Subheading>
          {detail.lines.map((line) => (
            <View key={line.id} className="gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
              <Body className="font-medium">{line.name}</Body>
              <Muted className="text-sm">
                {t('history.qty')}: {line.quantity} · {t('history.unit')}:{' '}
                {formatMoney(line.unitPrice, detail.currency)} · {t('history.lineTotal')}:{' '}
                {formatMoney(line.lineTotal, detail.currency)}
              </Muted>
            </View>
          ))}
          <Body className="text-right text-lg font-semibold">
            {formatMoney(detail.total, detail.currency)}
          </Body>
        </Card>

        <Card className="gap-3">
          <Subheading>{t('history.saleDetailsTitle')}</Subheading>
          <StatusTag variant={detail.status === 'completed' ? 'verified' : 'pending'}>
            {detail.status}
          </StatusTag>
          <ReadOnlyField label={t('history.customer')} value={detail.customerDisplayName} />
          <ReadOnlyField label={t('history.payment')} value={detail.paymentMethod} />
          <ReadOnlyField
            label={t('history.submitted')}
            value={formatDisplayDateTime(detail.createdAt)}
          />
        </Card>
      </View>
    </FeatureScreen>
  )
}
