import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'

export function workflowStepLabel(
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
