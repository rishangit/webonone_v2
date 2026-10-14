import { useTranslation } from 'react-i18next'
import { ServiceScheduleMeta } from '@/features/data/components/ServiceScheduleMeta'
import {
  formatCompanyServiceScheduleSummary,
  formatCompanyServiceTimeModeLabel,
  resolveCompanyServiceTimePayload,
} from '@/features/data/utils/companyCatalogServiceListDisplay'
import type { HydratedCatalogItem } from '@/features/sales/types/catalog.types'

export function CompanyServiceListMeta({
  item,
  className,
}: {
  item: HydratedCatalogItem
  className?: string
}) {
  const { t } = useTranslation('catalog')
  const time = resolveCompanyServiceTimePayload(item)
  return (
    <ServiceScheduleMeta
      timeModeLabel={time.timeMode ? formatCompanyServiceTimeModeLabel(time.timeMode, t) : null}
      scheduleSummary={formatCompanyServiceScheduleSummary(item, t)}
      className={className}
    />
  )
}
