import { useTranslation } from 'react-i18next'
import { ServiceScheduleMeta } from '@/features/data/components/ServiceScheduleMeta'
import {
  formatServiceScheduleSummary,
  formatServiceTimeModeLabel,
  normalizeServiceListItem,
} from '@/features/data/utils/serviceListDisplay'
import type { CatalogItem } from '@/shared/types/data.types'

export function ServiceListMeta({ item, className }: { item: CatalogItem; className?: string }) {
  const { t } = useTranslation('services')
  const service = normalizeServiceListItem(item)
  return (
    <ServiceScheduleMeta
      timeModeLabel={service.timeMode ? formatServiceTimeModeLabel(service.timeMode, t) : null}
      scheduleSummary={formatServiceScheduleSummary(service, t)}
      className={className}
    />
  )
}
