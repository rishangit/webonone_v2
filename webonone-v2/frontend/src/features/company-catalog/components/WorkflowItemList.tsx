import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { ItemList, ItemListContent, ItemListItem } from '@webonone/ui-kit'
import { WorkflowItemListContent } from '@/features/company-catalog/components/WorkflowItemListContent'
import { WorkflowOrderThumb } from '@/features/company-catalog/components/WorkflowOrderThumb'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'

export function workflowItemTitle(item: ServiceWorkflowItem, t: TFunction<'catalog'>): string {
  if (item.kind === 'check_in') return t('workflowTab.checkIn')
  return item.space?.name ?? t('workflowTab.checkIn')
}

type WorkflowItemListProps = {
  items: ServiceWorkflowItem[]
  t: TFunction<'catalog'>
  showQueue?: boolean
  className?: string
  renderMenu?: (item: ServiceWorkflowItem, index: number) => ReactNode
}

export function WorkflowItemList({
  items,
  t,
  showQueue = false,
  className,
  renderMenu,
}: WorkflowItemListProps) {
  return (
    <ItemList className={className}>
      {items.map((item, index) => (
        <ItemListItem key={item.id}>
          <WorkflowOrderThumb orderNumber={item.orderNumber} />
          <ItemListContent>
            <WorkflowItemListContent
              item={item}
              title={workflowItemTitle(item, t)}
              t={t}
              showQueue={showQueue}
            />
          </ItemListContent>
          {renderMenu?.(item, index) ?? null}
        </ItemListItem>
      ))}
    </ItemList>
  )
}
