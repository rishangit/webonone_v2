import { useTranslation } from 'react-i18next'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionToken } from '@/features/calendar/types/event.types'
import { SessionWorkflowStepPanel } from '@/features/calendar/components/SessionWorkflowStepPanel'
import { SessionWorkflowStepProgress } from '@/features/calendar/components/SessionWorkflowStepProgress'
import {
  tokensAtWorkflowStep,
  type WorkflowStepQueueSnapshot,
} from '@/features/calendar/utils/workflowStepQueue'
import type { SaleItemKind } from '@/features/sales/types/sales.types'

type SessionWorkflowTabProps = {
  isDuration: boolean
  workflowItems: ServiceWorkflowItem[]
  selectedWorkflowStepId: string
  onSelectWorkflowStep: (stepId: string) => void
  displayTokens: SessionToken[]
  overviewTokens: SessionToken[]
  checkedInUserIds: Set<string>
  durationAttendeeToken: SessionToken | null
  canOperateSession: boolean
  canManageSession: boolean
  isAssignedStaff: boolean
  completingTokenId: string | null
  submissionByTokenForm: Record<string, string>
  onFillForm: (params: {
    userId: string
    displayName: string
    email?: string | null
    sessionTokenId?: string
    formId: string
  }) => void
  onViewForm: (params: {
    userId: string
    displayName: string
    email?: string | null
    sessionTokenId?: string
    formId: string
    submissionId: string
  }) => void
  onCompleteWorkflowStep: (tokenId: string) => void
  serviceId: string
  serviceName: string
  enabledKinds: SaleItemKind[]
  canSellDuringSession: boolean
  sessionStepQueues?: Record<string, WorkflowStepQueueSnapshot | null> | null
  isPersonal: boolean
  onSaleCompleted?: (customerEmail?: string | null) => void
}

export function SessionWorkflowTab({
  isDuration,
  workflowItems,
  selectedWorkflowStepId,
  onSelectWorkflowStep,
  displayTokens,
  overviewTokens,
  checkedInUserIds,
  durationAttendeeToken,
  canOperateSession,
  canManageSession,
  isAssignedStaff,
  completingTokenId,
  submissionByTokenForm,
  onFillForm,
  onViewForm,
  onCompleteWorkflowStep,
  serviceId,
  serviceName,
  enabledKinds,
  canSellDuringSession,
  sessionStepQueues,
  isPersonal,
  onSaleCompleted,
}: SessionWorkflowTabProps) {
  const { t } = useTranslation('calendar')

  if (workflowItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('sessionDetail.workflow.empty')}</p>
    )
  }

  const item =
    workflowItems.find((entry) => entry.id === selectedWorkflowStepId) ?? workflowItems[0]
  if (!item) return null

  const atStep = tokensAtWorkflowStep(displayTokens, item.id, {
    itemKind: item.kind,
    checkedInUserIds,
  })
  const stepTokens =
    item.kind === 'check_in'
      ? overviewTokens.filter(
          (token) =>
            atStep.some((entry) => entry.id === token.id) ||
            checkedInUserIds.has(token.userId),
        )
      : overviewTokens.filter((token) => checkedInUserIds.has(token.userId))

  const canSellOnStep =
    canSellDuringSession &&
    Boolean(item.addItemsEnabled) &&
    (canManageSession || isAssignedStaff)

  return (
    <div className="flex flex-col gap-6">
      <SessionWorkflowStepProgress
        items={workflowItems}
        selectedId={item.id}
        onSelect={onSelectWorkflowStep}
      />
      <SessionWorkflowStepPanel
        item={item}
        items={workflowItems}
        tokens={displayTokens}
        stepTokens={isDuration ? [] : stepTokens}
        showQueue={!isDuration && Boolean(item.sessionQueue)}
        singleAttendeeToken={isDuration ? durationAttendeeToken : undefined}
        canComplete={
          isDuration
            ? canOperateSession
            : canOperateSession && (canManageSession || isAssignedStaff)
        }
        completingId={completingTokenId}
        checkedInUserIds={checkedInUserIds}
        canFillForms={canOperateSession}
        submissionByTokenForm={submissionByTokenForm}
        onFillForm={(token, formId) => {
          onFillForm({
            userId: token.userId,
            displayName: token.userDisplayName,
            email: token.userEmail,
            sessionTokenId: token.id,
            formId,
          })
        }}
        onViewForm={(token, formId, submissionId) => {
          onViewForm({
            userId: token.userId,
            displayName: token.userDisplayName,
            email: token.userEmail,
            sessionTokenId: token.id,
            formId,
            submissionId,
          })
        }}
        onComplete={onCompleteWorkflowStep}
        serviceId={serviceId}
        serviceName={serviceName}
        enabledKinds={enabledKinds}
        canSell={canSellOnStep}
        stepQueueLabels={isPersonal ? sessionStepQueues?.[item.id] ?? null : null}
        onSaleCompleted={onSaleCompleted}
      />
    </div>
  )
}
