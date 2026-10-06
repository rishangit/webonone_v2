import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from '@webonone/ui-kit'
import {
  formatRelativeUpdated,
  resolveSmsCreditsViewState,
} from '@/features/dashboard/utils/formatRelativeUpdated'

interface SmsCreditsCardProps {
  status: 'idle' | 'loading' | 'error'
  configured: boolean | null
  balance: number | null
  lastUpdated: string | null
  error: string | null
  hasLoaded: boolean
  onRefresh: () => void
}

export function SmsCreditsCard({
  status,
  configured,
  balance,
  lastUpdated,
  error,
  hasLoaded,
  onRefresh,
}: SmsCreditsCardProps) {
  const { t, i18n } = useTranslation('shell')
  const view = resolveSmsCreditsViewState({
    status,
    configured,
    balance,
    lastUpdated,
    error,
    hasLoaded,
  })
  const refreshing = status === 'loading' && hasLoaded

  const relative = formatRelativeUpdated(lastUpdated)
  const formattedBalance =
    view.kind === 'ready'
      ? view.balance.toLocaleString(i18n.language === 'si' ? 'si-LK' : 'en-US')
      : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('smsCreditsTitle')}
        </CardTitle>
        {view.kind === 'ready' || view.kind === 'error' ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={t('smsCreditsRefresh')}
            disabled={refreshing}
            onClick={onRefresh}
          >
            {refreshing ? (
              <Spinner size="sm" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {view.kind === 'loading' ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>{t('smsCreditsLoading')}</span>
          </div>
        ) : null}

        {view.kind === 'not_configured' ? (
          <>
            <p className="text-base font-medium">{t('smsCreditsNotConfigured')}</p>
            <Button asChild variant="outline" className="h-10">
              <Link to="/devices?tab=settings">{t('smsCreditsConfigure')}</Link>
            </Button>
          </>
        ) : null}

        {view.kind === 'error' ? (
          <>
            <p className="text-base font-medium">{t('smsCreditsError')}</p>
            <Button type="button" variant="outline" className="h-10" onClick={onRefresh}>
              {t('smsCreditsRetry')}
            </Button>
          </>
        ) : null}

        {view.kind === 'ready' ? (
          <>
            <p className="text-3xl font-semibold tabular-nums">{formattedBalance}</p>
            <p className="text-sm text-muted-foreground">{t('smsCreditsRemaining')}</p>
            <p className="text-xs text-muted-foreground">{t('gatewayTextLk')}</p>
            {relative ? (
              <p className="text-xs text-muted-foreground">
                {t('smsCreditsLastUpdated', { relative })}
              </p>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
