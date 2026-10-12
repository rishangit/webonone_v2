import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from '@webonone/ui-kit'
import { WorkflowOrderThumb } from '@/features/company-catalog/components/WorkflowOrderThumb'
import { WorkflowStaffNames } from '@/features/company-catalog/components/WorkflowStaffNames'
import { SessionWorkflowStepFormLinks } from '@/features/calendar/components/SessionWorkflowStepFormLinks'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import type { SessionToken } from '@/features/calendar/types/event.types'
import { workflowStepLabel } from '@/features/calendar/utils/workflowStepLabels'

export type SessionWorkflowMemberFormsContext = {
  token: SessionToken
  submissionByTokenForm: Record<string, string>
  onFillForm: (token: SessionToken, formId: string) => void
  onViewForm: (token: SessionToken, formId: string, submissionId: string) => void
}

type SessionWorkflowOverviewCardProps = {
  items: ServiceWorkflowItem[]
  memberForms?: SessionWorkflowMemberFormsContext | null
}

export function SessionWorkflowOverviewCard({
  items,
  memberForms = null,
}: SessionWorkflowOverviewCardProps) {
  const { t } = useTranslation('calendar')

  return (
    <Card variant="list">
      <CardHeader>
        <CardTitle className="text-lg">{t('sessionDetail.workflow.title')}</CardTitle>
        <CardDescription>{t('sessionDetail.workflow.memberHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <ItemListEmpty>{t('sessionDetail.workflow.empty')}</ItemListEmpty>
        ) : (
          <ItemList className="py-0">
            {items.map((item, index) => (
              <ItemListItem key={item.id}>
                <WorkflowOrderThumb orderNumber={item.orderNumber} />
                <ItemListContent>
                  <div className="space-y-2">
                    <p className="truncate font-medium">
                      {workflowStepLabel(item, index, t)}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('sessionDetail.step.staff')}
                      </p>
                      <WorkflowStaffNames
                        staff={item.staff}
                        emptyLabel={t('sessionDetail.step.none')}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('sessionDetail.step.forms')}
                      </p>
                      {memberForms ? (
                        <SessionWorkflowStepFormLinks
                          item={item}
                          token={memberForms.token}
                          submissionByTokenForm={memberForms.submissionByTokenForm}
                          onFillForm={memberForms.onFillForm}
                          onViewForm={memberForms.onViewForm}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {item.forms.length > 0
                            ? item.forms.map((form) => form.name ?? form.id).join(', ')
                            : t('sessionDetail.step.none')}
                        </p>
                      )}
                    </div>
                  </div>
                </ItemListContent>
              </ItemListItem>
            ))}
          </ItemList>
        )}
      </CardContent>
    </Card>
  )
}
