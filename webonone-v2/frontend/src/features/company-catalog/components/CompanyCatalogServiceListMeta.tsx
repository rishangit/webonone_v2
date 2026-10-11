import { useTranslation } from 'react-i18next'
import { cn } from '@webonone/ui-kit'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import type { HydratedCatalogItem } from '../types/companyCatalog.types'
import {
  formatCompanyServiceScheduleSummary,
  formatCompanyServiceTimeModeLabel,
  resolveCompanyServiceTimePayload,
} from '../utils/companyCatalogServiceListDisplay'

type CompanyCatalogServiceListMetaProps = {
  item: HydratedCatalogItem
  align?: 'start' | 'end'
  showPrice?: boolean
  className?: string
}

export function CompanyCatalogServiceListMeta({
  item,
  align = 'start',
  showPrice = true,
  className,
}: CompanyCatalogServiceListMetaProps) {
  const { t } = useTranslation('catalog')
  const time = resolveCompanyServiceTimePayload(item)

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-0.5 text-sm',
        align === 'end' ? 'items-end text-right' : 'items-start text-left',
        className,
      )}
    >
      <span className="text-foreground">{formatCompanyServiceTimeModeLabel(time.timeMode, t)}</span>
      <span className="text-muted-foreground">
        {formatCompanyServiceScheduleSummary(item, t)}
      </span>
      {showPrice ? (
        <span
          className={cn(
            'font-medium tabular-nums text-foreground',
            align === 'end' ? 'mt-auto' : undefined,
          )}
        >
          {item.listPrice != null ? formatLkr(item.listPrice) : '—'}
        </span>
      ) : null}
    </div>
  )
}
