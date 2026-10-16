import { useTranslation } from 'react-i18next'
import { cn } from '@webonone/ui-kit'
import type { CatalogItem } from '@/shared/types/data.types'
import {
  formatServiceScheduleSummary,
  formatServiceTimeModeLabel,
  normalizeServiceListItem,
} from '@/features/services/utils/serviceListDisplay'

type ServiceListMetaProps = {
  item: CatalogItem
  align?: 'start' | 'end'
  className?: string
}

export function ServiceListMeta({ item, align = 'start', className }: ServiceListMetaProps) {
  const { t } = useTranslation('services')
  const service = normalizeServiceListItem(item)

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-0.5 text-sm',
        align === 'end' ? 'items-end text-right' : 'items-start text-left',
        className,
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-wrap items-baseline gap-x-1.5',
          align === 'end' ? 'justify-end' : 'justify-start',
        )}
      >
        <span className="shrink-0 text-foreground">
          {formatServiceTimeModeLabel(service.timeMode, t)}
        </span>
        <span className="min-w-0 text-muted-foreground">
          {formatServiceScheduleSummary(service, t)}
        </span>
      </div>
    </div>
  )
}
