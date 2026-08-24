import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusTag,
} from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionToken } from '@/features/calendar/types/event.types'
import { SessionDetailSectionTabs } from '@/features/calendar/components/SessionDetailSectionTabs'
import { TokenWorkflowProgress } from '@/features/calendar/components/TokenWorkflowProgress'
import { isWorkflowStepCompleted } from '@/features/calendar/utils/workflowStepQueue'

type DurationSessionWorkflowCardProps = {
  items: ServiceWorkflowItem[]
  token: SessionToken | null
  canComplete: boolean
  completingId: string | null
  checkedIn: boolean
  canFillForms: boolean
  submissionByTokenForm: Record<string, string>
  onFillForm: (formId: string) => void
  onViewForm: (formId: string, submissionId: string) => void
  onComplete: () => void
}

function workflowTabLabel(
  item: ServiceWorkflowItem,
  index: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const spaceName =
    item.space?.name && item.space.name !== item.space.id ? item.space.name : null
  if (item.kind === 'check_in') {
    return spaceName
      ? `${t('sessionDetail.tabs.checkIn')} · ${spaceName}`
      : t('sessionDetail.tabs.checkIn')
  }
  return spaceName ?? t('sessionDetail.tabs.step', { number: index + 1 })
}

export function DurationSessionWorkflowCard({
  items,
  token,
  canComplete,
  completingId,
  checkedIn,
  canFillForms,
  submissionByTokenForm,
  onFillForm,
  onViewForm,
  onComplete,
}: DurationSessionWorkflowCardProps) {
  const { t } = useTranslation('calendar')
  const [stepTab, setStepTab] = useState(items[0]?.id ?? '')

  useEffect(() => {
    if (items.some((item) => item.id === stepTab)) return
    setStepTab(items[0]?.id ?? '')
  }, [items, stepTab])

  const item = items.find((entry) => entry.id === stepTab) ?? items[0]
  const atThisStep =
    Boolean(item && token) &&
    !token?.workflowProgress?.done &&
    token?.workflowProgress?.steps[token.workflowProgress.currentIndex]?.id === item?.id
  const showCheckInAction =
    Boolean(item) && canComplete && item?.kind === 'check_in' && atThisStep && !checkedIn
  const showCompleteAction =
    Boolean(item) && canComplete && item?.kind !== 'check_in' && atThisStep
  const forms = item?.forms ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('sessionDetail.workflow.title')}</CardTitle>
        <CardDescription>{t('sessionDetail.workflow.hint')}</CardDescription>
      </CardHeader>
      <CardContent>
        {!item ? (
          <p className="text-sm text-muted-foreground">{t('sessionDetail.workflow.empty')}</p>
        ) : (
          <SessionDetailSectionTabs
            ariaLabel={t('sessionDetail.workflow.ariaSteps')}
            tab={stepTab}
            onTabChange={setStepTab}
            tabs={items.map((entry, index) => ({
              id: entry.id,
              label: workflowTabLabel(entry, index, t),
            }))}
          >
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-3 lg:col-span-2">
                {token ? (
                  <>
                    <p className="truncate font-medium">{token.userDisplayName}</p>
                    <TokenWorkflowProgress progress={token.workflowProgress} />
                    {forms.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {forms.map((form) => {
                          const submissionId = submissionByTokenForm[`${token.id}:${form.id}`]
                          if (submissionId) {
                            return (
                              <Button
                                key={form.id}
                                type="button"
                                variant="link"
                                className="h-auto px-0 text-sm"
                                onClick={() => onViewForm(form.id, submissionId)}
                              >
                                {t('session.viewForm')}
                                {forms.length > 1 ? ` · ${form.name ?? form.id}` : ''}
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
                              onClick={() => onFillForm(form.id)}
                            >
                              {t('session.fillForm')}
                              {forms.length > 1 ? ` · ${form.name ?? form.id}` : ''}
                            </Button>
                          )
                        })}
                      </div>
                    ) : null}
                    {showCheckInAction || showCompleteAction ? (
                      <div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={completingId === token.id}
                          onClick={onComplete}
                        >
                          {completingId === token.id
                            ? t('sessionDetail.step.completing')
                            : item.kind === 'check_in'
                              ? t('sessionDetail.step.checkInComplete')
                              : t('sessionDetail.step.complete')}
                        </Button>
                      </div>
                    ) : null}
                    {item.kind === 'check_in' ? (
                      checkedIn ? (
                        <StatusTag variant="verified">{t('session.tokenStatus.checkedIn')}</StatusTag>
                      ) : (
                        <StatusTag variant="pending">
                          {t('session.tokenStatus.notCheckedIn')}
                        </StatusTag>
                      )
                    ) : isWorkflowStepCompleted(token.workflowProgress, item.id) ? (
                      <StatusTag variant="verified">{t('session.tokenStatus.stepCompleted')}</StatusTag>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('sessionDetail.workflow.noAttendee')}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('sessionDetail.step.space')}
                  </p>
                  <p className="text-sm">{item.space?.name ?? t('sessionDetail.step.none')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('sessionDetail.step.staff')}
                  </p>
                  <p className="text-sm">
                    {item.staff.length > 0
                      ? item.staff.map((entry) => entry.displayName).join(', ')
                      : t('sessionDetail.step.none')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('sessionDetail.step.forms')}
                  </p>
                  <p className="text-sm">
                    {forms.length > 0
                      ? forms.map((form) => form.name ?? form.id).join(', ')
                      : t('sessionDetail.step.none')}
                  </p>
                </div>
              </div>
            </div>
          </SessionDetailSectionTabs>
        )}
      </CardContent>
    </Card>
  )
}
