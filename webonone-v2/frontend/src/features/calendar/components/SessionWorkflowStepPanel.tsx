import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ImagePreview,
  StatusTag,
} from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionToken } from '@/features/calendar/types/event.types'
import { SessionCurrentlyServingCard } from '@/features/calendar/components/SessionCurrentlyServingCard'
import { SessionQueueBoard } from '@/features/calendar/components/SessionQueueBoard'
import { TokenWorkflowProgress } from '@/features/calendar/components/TokenWorkflowProgress'
import {
  computeWorkflowStepViewerQueue,
  computeWorkflowStepQueue,
  isWorkflowStepCompleted,
  tokensAtWorkflowStep,
  type WorkflowStepQueueSnapshot,
} from '@/features/calendar/utils/workflowStepQueue'
import { SessionTokenSaleActions } from '@/features/sales/components/SessionTokenSaleActions'
import type { SaleItemKind } from '@/features/sales/types/sales.types'

type SessionWorkflowStepPanelProps = {
  item: ServiceWorkflowItem
  items: ServiceWorkflowItem[]
  tokens: SessionToken[]
  stepTokens: SessionToken[]
  showQueue: boolean
  canComplete: boolean
  completingId: string | null
  checkedInUserIds?: Set<string>
  canFillForms?: boolean
  submissionByTokenForm?: Record<string, string>
  onFillForm?: (token: SessionToken, formId: string) => void
  onViewForm?: (token: SessionToken, formId: string, submissionId: string) => void
  onComplete: (tokenId: string) => void
  serviceId: string
  serviceName: string
  enabledKinds: SaleItemKind[]
  canSell: boolean
  /** Per-step queue from API (personal /me with filtered tokens). */
  stepQueueLabels?: WorkflowStepQueueSnapshot | null
}

export function SessionWorkflowStepPanel({
  item,
  items,
  tokens,
  stepTokens,
  showQueue,
  canComplete,
  completingId,
  checkedInUserIds,
  canFillForms = false,
  submissionByTokenForm,
  onFillForm,
  onViewForm,
  onComplete,
  serviceId,
  serviceName,
  enabledKinds,
  canSell,
  stepQueueLabels,
}: SessionWorkflowStepPanelProps) {
  const { t } = useTranslation('calendar')
  const [focusedTokenId, setFocusedTokenId] = useState<string | null>(null)
  const title =
    item.kind === 'check_in'
      ? t('sessionDetail.tabs.checkIn')
      : (item.space?.name ?? t('sessionDetail.tabs.step', { number: item.orderNumber }))
  const operatorQueue =
    showQueue && canComplete
      ? computeWorkflowStepQueue(tokens, item, items, focusedTokenId, checkedInUserIds)
      : null
  const viewerStepQueue: WorkflowStepQueueSnapshot | null =
    showQueue && !canComplete
      ? (stepQueueLabels ?? computeWorkflowStepViewerQueue(tokens, item, items, checkedInUserIds))
      : null
  const queue = operatorQueue ?? viewerStepQueue
  const servingTokenId = queue?.currentTokenId ?? null
  const currentToken = servingTokenId
    ? (tokens.find((entry) => entry.id === servingTokenId) ?? null)
    : null
  const servingTokenLabel =
    currentToken?.tokenLabel ?? (viewerStepQueue?.currentTokenLabel ?? queue?.currentTokenLabel ?? null)

  useEffect(() => {
    if (!showQueue || !canComplete) {
      setFocusedTokenId(null)
      return
    }
    const atStep = tokensAtWorkflowStep(tokens, item.id, {
      itemKind: item.kind,
      checkedInUserIds,
    })
    const servingId = atStep.find((token) => token.status === 'serving')?.id
    const defaultId = servingId ?? atStep[0]?.id ?? stepTokens[0]?.id ?? null
    if (focusedTokenId && atStep.some((token) => token.id === focusedTokenId)) return
    setFocusedTokenId(defaultId)
  }, [canComplete, checkedInUserIds, focusedTokenId, item, showQueue, stepTokens, tokens])

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        {showQueue && queue ? (
          <SessionCurrentlyServingCard
            token={currentToken}
            fallbackTokenLabel={servingTokenLabel}
            item={item}
            canFillForms={canFillForms}
            submissionByTokenForm={submissionByTokenForm}
            onFillForm={onFillForm}
            onViewForm={onViewForm}
            serviceId={serviceId}
            serviceName={serviceName}
            enabledKinds={enabledKinds}
            canSell={canSell}
          />
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('sessionDetail.step.tokensTitle')}</CardTitle>
            <CardDescription>{t('sessionDetail.step.tokensHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            {stepTokens.length === 0 ? (
              <ItemListEmpty>{t('sessionDetail.step.tokensEmpty')}</ItemListEmpty>
            ) : (
              <ItemList>
                {stepTokens.map((token) => {
                  const isCheckedIn = Boolean(checkedInUserIds?.has(token.userId))
                  const atThisStep =
                    !token.workflowProgress?.done &&
                    (item.kind === 'check_in' && !isCheckedIn
                      ? token.workflowProgress!.currentIndex < 0 ||
                        token.workflowProgress?.steps[token.workflowProgress.currentIndex]?.id ===
                          item.id
                      : token.workflowProgress!.currentIndex >= 0 &&
                        token.workflowProgress?.steps[token.workflowProgress.currentIndex]?.id ===
                          item.id)
                  const showCheckInAction =
                    canComplete && item.kind === 'check_in' && !isCheckedIn && atThisStep
                  const showCompleteAction =
                    canComplete && item.kind !== 'check_in' && !showQueue
                  return (
                  <ItemListItem
                    key={token.id}
                    className={
                      servingTokenId === token.id ? 'ring-1 ring-primary/40' : undefined
                    }
                  >
                    <ImagePreview
                      src={token.userAvatarUrl}
                      alt={token.userDisplayName}
                      mode="view"
                      className="h-10 w-10 rounded-md"
                    />
                    <ItemListContent>
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{token.tokenLabel}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {token.userDisplayName}
                            </p>
                            <TokenWorkflowProgress progress={token.workflowProgress} />
                          </div>
                          {item.forms?.length ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {item.forms.map((form) => {
                                const submissionId =
                                  submissionByTokenForm?.[`${token.id}:${form.id}`]
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
                                      {item.forms.length > 1
                                        ? ` · ${form.name ?? form.id}`
                                        : ''}
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
                                    {item.forms.length > 1
                                      ? ` · ${form.name ?? form.id}`
                                      : ''}
                                  </Button>
                                )
                              })}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {checkedInUserIds ? (
                            item.kind === 'check_in' ? (
                              isCheckedIn ? (
                                <StatusTag variant="verified">
                                  {t('session.tokenStatus.checkedIn')}
                                </StatusTag>
                              ) : (
                                <StatusTag variant="pending">
                                  {t('session.tokenStatus.notCheckedIn')}
                                </StatusTag>
                              )
                            ) : isWorkflowStepCompleted(token.workflowProgress, item.id) ? (
                              <StatusTag variant="verified">
                                {t('session.tokenStatus.stepCompleted')}
                              </StatusTag>
                            ) : null
                          ) : null}
                          {showCheckInAction || showCompleteAction ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={completingId === token.id}
                              onClick={() => onComplete(token.id)}
                            >
                              {completingId === token.id
                                ? t('sessionDetail.step.completing')
                                : item.kind === 'check_in'
                                  ? t('sessionDetail.step.checkInComplete')
                                  : t('sessionDetail.step.complete')}
                            </Button>
                          ) : null}
                          {canSell ? (
                            <SessionTokenSaleActions
                              token={{
                                id: token.id,
                                userId: token.userId,
                                userDisplayName: token.userDisplayName,
                                tokenLabel: token.tokenLabel,
                              }}
                              serviceId={serviceId}
                              serviceName={serviceName}
                              enabledKinds={enabledKinds}
                              canSell={canSell}
                            />
                          ) : null}
                        </div>
                      </div>
                    </ItemListContent>
                  </ItemListItem>
                  )
                })}
              </ItemList>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        {queue ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('sessionDetail.step.queueTitle')}</CardTitle>
              <CardDescription>{t('sessionDetail.step.queueHint')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SessionQueueBoard
                prevTokenLabel={queue.prevTokenLabel}
                currentTokenLabel={queue.currentTokenLabel}
                nextTokenLabel={queue.nextTokenLabel}
                actions={
                  canComplete && operatorQueue ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={!operatorQueue.previousTokenId}
                        onClick={() => {
                          if (operatorQueue.previousTokenId) {
                            setFocusedTokenId(operatorQueue.previousTokenId)
                          }
                        }}
                      >
                        {t('sessionDetail.step.previous')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1"
                        disabled={
                          !operatorQueue.currentTokenId ||
                          completingId === operatorQueue.currentTokenId
                        }
                        onClick={() => {
                          if (operatorQueue.currentTokenId) onComplete(operatorQueue.currentTokenId)
                        }}
                      >
                        {completingId === operatorQueue.currentTokenId
                          ? t('sessionDetail.step.completing')
                          : t('sessionDetail.step.next')}
                      </Button>
                    </div>
                  ) : null
                }
              />
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{t('sessionDetail.step.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('sessionDetail.step.space')}</p>
              <p className="text-sm">{item.space?.name ?? t('sessionDetail.step.none')}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('sessionDetail.step.staff')}</p>
              <p className="text-sm">
                {item.staff.length > 0
                  ? item.staff.map((entry) => entry.displayName).join(', ')
                  : t('sessionDetail.step.none')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('sessionDetail.step.forms')}</p>
              <p className="text-sm">
                {item.forms.length > 0
                  ? item.forms.map((form) => form.name ?? form.id).join(', ')
                  : t('sessionDetail.step.none')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
