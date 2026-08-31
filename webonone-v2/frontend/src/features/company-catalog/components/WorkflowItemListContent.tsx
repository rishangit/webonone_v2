import type { TFunction } from 'i18next'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'
import { WorkflowStaffNames } from '@/features/company-catalog/components/WorkflowStaffNames'

type WorkflowItemListContentProps = {
  item: ServiceWorkflowItem
  title: string
  t: TFunction<'catalog'>
  showQueue?: boolean
}

export function WorkflowItemListContent({
  item,
  title,
  t,
  showQueue = false,
}: WorkflowItemListContentProps) {
  return (
    <div className="space-y-2">
      <p className="truncate font-medium">{title}</p>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{t('workflowTab.staff')}</p>
        <WorkflowStaffNames staff={item.staff} emptyLabel={t('workflowTab.none')} />
      </div>
      <p className="truncate text-sm text-muted-foreground">
        {t('workflowTab.formsLine', {
          value:
            item.forms.length > 0
              ? item.forms.map((entry) => entry.name ?? entry.id).join(', ')
              : t('workflowTab.none'),
        })}
      </p>
      {showQueue ? (
        <p className="truncate text-sm text-muted-foreground">
          {t('workflowTab.queueLine', {
            value: item.sessionQueue ? t('workflowTab.yes') : t('workflowTab.no'),
          })}
        </p>
      ) : null}
    </div>
  )
}
