import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
  StatusTag,
} from '@webonone/ui-kit'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import {
  getSaleHistoryDetail,
  type SaleHistoryDetail,
} from '@/features/users/services/userHistoryApi'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function formatMoney(value: number, currency: string): string {
  return `${currency} ${value.toFixed(2)}`
}

export function HistorySaleDetailPage() {
  const { t } = useTranslation('users')
  const { id: userId, saleId } = useParams<{ id: string; saleId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<SaleHistoryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  usePlatformLoading(loading && !detail ? t('loading.history') : null)

  useEffect(() => {
    if (!saleId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getSaleHistoryDetail(saleId)
      .then((next) => {
        if (!cancelled) setDetail(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('errors.loadHistoryDetailFailed'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [saleId, t])

  const backToUser = () => {
    if (userId) navigate(`/users/${userId}?tab=history`)
    else navigate('/users')
  }

  if (loading && !detail) return null

  if (error && !detail) {
    return (
      <FeaturePage
        title={t('history.saleHistoryTitle')}
        description={t('history.saleHistoryLoadError')}
        onBack={backToUser}
        backLabel={t('common:back')}
      >
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!detail) return null

  return (
    <FeaturePage
      title={detail.billNumber}
      description={t('history.saleHistoryTitle')}
      onBack={backToUser}
      backLabel={t('common:back')}
    >
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('history.saleLinesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">{t('history.item')}</th>
                      <th className="py-2 pr-3 text-right">{t('history.qty')}</th>
                      <th className="py-2 pr-3 text-right">{t('history.unit')}</th>
                      <th className="py-2 text-right">{t('history.lineTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((line) => (
                      <tr key={line.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{line.name}</td>
                        <td className="py-2 pr-3 text-right">{line.quantity}</td>
                        <td className="py-2 pr-3 text-right">
                          {formatMoney(line.unitPrice, detail.currency)}
                        </td>
                        <td className="py-2 text-right">
                          {formatMoney(line.lineTotal, detail.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-right text-lg font-semibold">
                {formatMoney(detail.total, detail.currency)}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('history.saleDetailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusTag variant={detail.status === 'completed' ? 'verified' : 'pending'}>
                {detail.status}
              </StatusTag>
              <DetailField label={t('history.customer')} value={detail.customerDisplayName} />
              <DetailField label={t('history.payment')} value={detail.paymentMethod} />
              <DetailField
                label={t('history.submitted')}
                value={formatDisplayDateTime(detail.createdAt)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </FeaturePage>
  )
}
