import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContactValueLine,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ImagePreview,
  StatusTag,
  itemListThumbClassName,
} from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionToken } from '@/features/calendar/types/event.types'
import { SessionCurrentlyServingCard } from '@/features/calendar/components/SessionCurrentlyServingCard'
import { SessionQueueBoard } from '@/features/calendar/components/SessionQueueBoard'
import { SessionTokenUserIdentity } from '@/features/calendar/components/SessionTokenUserIdentity'
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
  libraryItemsEnabled?: boolean
  /** Per-step queue from API (personal /me with filtered tokens). */
  stepQueueLabels?: WorkflowStepQueueSnapshot | null
  /** When set, renders a single-attendee card instead of the tokens list (duration sessions). */
  singleAttendeeToken?: SessionToken | null
  onSaleCompleted?: (customerEmail?: string | null) => void
}

type SessionWorkflowTokenRowProps = {
  token: SessionToken
  item: ServiceWorkflowItem
  isCheckedIn: boolean
  showCheckInAction: boolean
  showCompleteAction: boolean
  completingId: string | null
  canFillForms: boolean
  submissionByTokenForm?: Record<string, string>
  onFillForm?: (token: SessionToken, formId: string) => void
  onViewForm?: (token: SessionToken, formId: string, submissionId: string) => void
  onComplete: (tokenId: string) => void
  serviceId: string
  serviceName: string
  enabledKinds: SaleItemKind[]
  canSell: boolean
  libraryItemsEnabled?: boolean
  showCheckedInStatus: boolean
  /** When true, avatar is rendered by the parent (ItemList row). */
  omitAvatar?: boolean
  /** Hero layout with sale actions on the right (duration attendee card). */
  variant?: 'compact' | 'serving'
  onSaleCompleted?: (customerEmail?: string | null) => void
}

function SessionWorkflowTokenRow({
  token,
  item,
  isCheckedIn,
  showCheckInAction,
  showCompleteAction,
  completingId,
  canFillForms,
  submissionByTokenForm,
  onFillForm,
  onViewForm,
  onComplete,
  serviceId,
  serviceName,
  enabledKinds,
  canSell,
  libraryItemsEnabled = false,
  showCheckedInStatus,
  omitAvatar = false,
  variant = 'compact',
  onSaleCompleted,
}: SessionWorkflowTokenRowProps) {
  const { t } = useTranslation('calendar')

  const statusTags = showCheckedInStatus ? (
    item.kind === 'check_in' ? (
      isCheckedIn ? (
        <StatusTag variant="verified">{t('session.tokenStatus.checkedIn')}</StatusTag>
      ) : (
        <StatusTag variant="pending">{t('session.tokenStatus.notCheckedIn')}</StatusTag>
      )
    ) : isWorkflowStepCompleted(token.workflowProgress, item.id) ? (
      <StatusTag variant="verified">{t('session.tokenStatus.stepCompleted')}</StatusTag>
    ) : null
  ) : null

  const renderCompleteButton = (className?: string) => {
    if (!showCheckInAction && !showCompleteAction) return null
    return (
      <Button
        type="button"
        size="sm"
        className={className}
        disabled={completingId === token.id}
        onClick={() => onComplete(token.id)}
      >
        {completingId === token.id
          ? t('sessionDetail.step.completing')
          : item.kind === 'check_in'
            ? t('sessionDetail.step.checkInComplete')
            : t('sessionDetail.step.complete')}
      </Button>
    )
  }

  const completeButton = renderCompleteButton()
  const desktopCompleteButton = renderCompleteButton('hidden h-10 sm:inline-flex')
  const mobileCompleteButton = renderCompleteButton('h-10 w-full sm:hidden')

  const saleActions =
    canSell && serviceId && serviceName && isCheckedIn ? (
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
        onSaleCompleted={onSaleCompleted}
      />
    ) : null

  const formLinks = item.forms?.length ? (
    <>
      {item.forms.map((form) => {
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
      })}
    </>
  ) : null

  const actionLinks =
    formLinks || saleActions ? (
      <div className="flex w-full flex-wrap items-center justify-start gap-x-2 gap-y-1">
        {formLinks}
        {saleActions}
      </div>
    ) : null

  const rightActions =
    statusTags || completeButton ? (
      <div className="flex shrink-0 flex-col items-end gap-2">
        {statusTags}
        {completeButton}
      </div>
    ) : null

  if (variant === 'serving') {
    return (
      <div className="flex w-full min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <SessionTokenUserIdentity
            displayName={token.userDisplayName}
            email={token.userEmail}
            avatarUrl={token.userAvatarUrl}
            size="hero"
            nameSize="lg"
            noEmailLabel={t('sessionDetail.checkIn.noEmail')}
          />
          {statusTags || desktopCompleteButton ? (
            <div className="flex shrink-0 flex-col items-end gap-2">
              {statusTags}
              {desktopCompleteButton}
            </div>
          ) : null}
        </div>
        {actionLinks || mobileCompleteButton ? (
          <div className="flex flex-col gap-2">
            {actionLinks}
            {mobileCompleteButton}
          </div>
        ) : null}
        <TokenWorkflowProgress progress={token.workflowProgress} layout="footer" />
      </div>
    )
  }

  const memberDetails = (
    <div className="min-w-0 flex-1 space-y-1">
      <p className="truncate font-medium text-foreground">{token.tokenLabel}</p>
      <p className="truncate text-sm text-foreground">{token.userDisplayName}</p>
      <ContactValueLine
        kind="email"
        value={token.userEmail}
        emptyLabel={t('sessionDetail.checkIn.noEmail')}
      />
    </div>
  )

  const topRow = (
    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
      {memberDetails}
      {rightActions}
    </div>
  )

  const rowBody = (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {omitAvatar ? (
        topRow
      ) : (
        <div className="flex min-w-0 items-start gap-3">
          <ImagePreview
            src={token.userAvatarUrl}
            alt={token.userDisplayName}
            mode="view"
            className={itemListThumbClassName}
          />
          {topRow}
        </div>
      )}
      {actionLinks}
      <TokenWorkflowProgress progress={token.workflowProgress} layout="footer" />
    </div>
  )

  return rowBody
}

function computeTokenAtThisStep(
  token: SessionToken,
  item: ServiceWorkflowItem,
  isCheckedIn: boolean,
): boolean {
  if (token.workflowProgress?.done) return false
  if (item.kind === 'check_in' && !isCheckedIn) {
    return (
      (token.workflowProgress?.currentIndex ?? 0) < 0 ||
      token.workflowProgress?.steps[token.workflowProgress.currentIndex]?.id === item.id
    )
  }
  return (
    (token.workflowProgress?.currentIndex ?? -1) >= 0 &&
    token.workflowProgress?.steps[token.workflowProgress.currentIndex]?.id === item.id
  )
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
  libraryItemsEnabled = false,
  stepQueueLabels,
  singleAttendeeToken,
  onSaleCompleted,
}: SessionWorkflowStepPanelProps) {
  const { t } = useTranslation('calendar')
  const [focusedTokenId, setFocusedTokenId] = useState<string | null>(null)
  const isDurationMode = singleAttendeeToken !== undefined
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

  const tokenProgressSignature = useMemo(
    () =>
      tokens
        .map(
          (token) =>
            `${token.id}:${token.workflowProgress?.currentIndex ?? 'x'}:${token.workflowProgress?.done ?? false}`,
        )
        .join('|'),
    [tokens],
  )

  useEffect(() => {
    setFocusedTokenId(null)
  }, [item.id])

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
  }, [
    canComplete,
    checkedInUserIds,
    focusedTokenId,
    item,
    showQueue,
    stepTokens,
    tokenProgressSignature,
    tokens,
  ])

  function renderTokenRow(
    token: SessionToken,
    options?: { highlightServing?: boolean; variant?: 'compact' | 'serving' },
  ) {
    const isCheckedIn = Boolean(checkedInUserIds?.has(token.userId))
    const atThisStep = computeTokenAtThisStep(token, item, isCheckedIn)
    const showCheckInAction =
      canComplete && item.kind === 'check_in' && !isCheckedIn && atThisStep
    const showCompleteAction = isDurationMode
      ? canComplete && item.kind !== 'check_in' && atThisStep
      : canComplete && item.kind !== 'check_in' && !showQueue

    const row = (
      <SessionWorkflowTokenRow
        token={token}
        item={item}
        isCheckedIn={isCheckedIn}
        showCheckInAction={showCheckInAction}
        showCompleteAction={showCompleteAction}
        completingId={completingId}
        canFillForms={canFillForms}
        submissionByTokenForm={submissionByTokenForm}
        onFillForm={onFillForm}
        onViewForm={onViewForm}
        onComplete={onComplete}
        serviceId={serviceId}
        serviceName={serviceName}
        enabledKinds={enabledKinds}
        canSell={canSell}
        libraryItemsEnabled={libraryItemsEnabled}
        showCheckedInStatus={Boolean(checkedInUserIds)}
        omitAvatar={options?.highlightServing}
        variant={options?.variant ?? 'compact'}
        onSaleCompleted={onSaleCompleted}
      />
    )

    if (options?.highlightServing) {
      return (
        <ItemListItem
          key={token.id}
          className={servingTokenId === token.id ? 'ring-1 ring-primary/40' : undefined}
        >
          <ImagePreview
            src={token.userAvatarUrl}
            alt={token.userDisplayName}
            mode="view"
            className={itemListThumbClassName}
          />
          <ItemListContent>{row}</ItemListContent>
        </ItemListItem>
      )
    }

    return row
  }

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
            libraryItemsEnabled={libraryItemsEnabled}
            isCheckedIn={Boolean(
              currentToken && checkedInUserIds?.has(currentToken.userId),
            )}
          />
        ) : null}
        {isDurationMode ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('sessionDetail.step.attendeeTitle')}</CardTitle>
              <CardDescription>{t('sessionDetail.step.attendeeHint')}</CardDescription>
            </CardHeader>
            <CardContent>
              {singleAttendeeToken ? (
                renderTokenRow(singleAttendeeToken, { variant: 'serving' })
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('sessionDetail.workflow.noAttendee')}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card variant="list">
            <CardHeader>
              <CardTitle className="text-lg">{t('sessionDetail.step.tokensTitle')}</CardTitle>
              <CardDescription>{t('sessionDetail.step.tokensHint')}</CardDescription>
            </CardHeader>
            <CardContent>
              {stepTokens.length === 0 ? (
                <ItemListEmpty>{t('sessionDetail.step.tokensEmpty')}</ItemListEmpty>
              ) : (
                <ItemList className="py-0">
                  {stepTokens.map((token) => renderTokenRow(token, { highlightServing: true }))}
                </ItemList>
              )}
            </CardContent>
          </Card>
        )}
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
                        <ChevronLeft className="h-4 w-4" aria-hidden />
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
                        {completingId !== operatorQueue.currentTokenId ? (
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        ) : null}
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
