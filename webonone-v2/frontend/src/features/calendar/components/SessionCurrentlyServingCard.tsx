import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionToken } from '@/features/calendar/types/event.types'
import { SessionTokenUserIdentity } from '@/features/calendar/components/SessionTokenUserIdentity'
import { SessionTokenSaleActions } from '@/features/sales/components/SessionTokenSaleActions'
import type { SaleItemKind } from '@/features/sales/types/sales.types'

type SessionCurrentlyServingCardProps = {
  token: SessionToken | null
  /** Label when the serving token is not in the viewer's token list (e.g. personal /me). */
  fallbackTokenLabel?: string | null
  item: ServiceWorkflowItem
  canFillForms?: boolean
  submissionByTokenForm?: Record<string, string>
  onFillForm?: (token: SessionToken, formId: string) => void
  onViewForm?: (token: SessionToken, formId: string, submissionId: string) => void
  serviceId?: string
  serviceName?: string
  enabledKinds?: SaleItemKind[]
  canSell?: boolean
  libraryItemsEnabled?: boolean
  isCheckedIn?: boolean
}

export function SessionCurrentlyServingCard({
  token,
  fallbackTokenLabel,
  item,
  canFillForms = false,
  submissionByTokenForm,
  onFillForm,
  onViewForm,
  serviceId,
  serviceName,
  enabledKinds = [],
  canSell = false,
  libraryItemsEnabled = false,
  isCheckedIn = false,
}: SessionCurrentlyServingCardProps) {
  const { t } = useTranslation('calendar')

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-lg">{t('sessionDetail.step.currentlyServingTitle')}</CardTitle>
        <CardDescription>{t('sessionDetail.step.currentlyServingHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        {!token && !fallbackTokenLabel ? (
          <p className="text-sm text-muted-foreground">
            {t('sessionDetail.step.currentlyServingEmpty')}
          </p>
        ) : !token ? (
          <p className="text-2xl font-semibold text-foreground">{fallbackTokenLabel}</p>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-2xl font-semibold text-foreground">{token.tokenLabel}</p>
                <SessionTokenUserIdentity
                  displayName={token.userDisplayName}
                  email={token.userEmail}
                  avatarUrl={token.userAvatarUrl}
                  size="hero"
                  noEmailLabel={t('sessionDetail.checkIn.noEmail')}
                />
              </div>
            </div>
            {item.forms?.length || (canSell && isCheckedIn && serviceId && serviceName) ? (
              <div className="flex w-full flex-wrap items-center justify-start gap-x-2 gap-y-1">
                {item.forms?.length
                  ? item.forms.map((form) => {
                      const submissionId = submissionByTokenForm?.[`${token.id}:${form.id}`]
                      if (submissionId) {
                        return (
                          <Button
                            key={form.id}
                            type="button"
                            variant="link"
                            className="h-auto px-0 text-sm"
                            onClick={() => onViewForm?.(token, form.id, submissionId)}
                          >
                            {t('session.viewForm')}
                            {item.forms.length > 1 ? ` · ${form.name ?? form.id}` : ''}
                          </Button>
                        )
                      }
                      if (!canFillForms) return null
                      return (
                        <Button
                          key={form.id}
                          type="button"
                          variant="link"
                          className="h-auto px-0 text-sm"
                          onClick={() => onFillForm?.(token, form.id)}
                        >
                          {t('session.fillForm')}
                          {item.forms.length > 1 ? ` · ${form.name ?? form.id}` : ''}
                        </Button>
                      )
                    })
                  : null}
                {canSell && isCheckedIn && serviceId && serviceName ? (
                  <SessionTokenSaleActions
                    token={{
                      id: token.id,
                      userId: token.userId,
                      userDisplayName: token.userDisplayName,
                      userEmail: token.userEmail,
                      tokenLabel: token.tokenLabel,
                    }}
                    serviceId={serviceId}
                    serviceName={serviceName}
                    enabledKinds={enabledKinds}
                    canSell={canSell}
                    libraryItemsEnabled={libraryItemsEnabled}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
