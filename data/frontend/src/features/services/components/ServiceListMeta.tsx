import { useTranslation } from 'react-i18next'
import { cn } from '@webonone/ui-kit'
import { formatProductListPrice } from '@/features/products/utils/productListStockLine'
import type { CatalogItem } from '@/shared/types/data.types'
import {
  formatServiceScheduleSummary,
  formatServiceTimeModeLabel,
  normalizeServiceListItem,
  resolveServiceListPrice,
} from '@/features/services/utils/serviceListDisplay'

type ServiceListMetaProps = {
  item: CatalogItem
  align?: 'start' | 'end'
  showPrice?: boolean
  className?: string
}

export function ServiceListMeta({
  item,
  align = 'start',
  showPrice = true,
  className,
}: ServiceListMetaProps) {
  const { t } = useTranslation('services')
  const service = normalizeServiceListItem(item)
  const price = resolveServiceListPrice(service)

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-0.5 text-sm',
        align === 'end' ? 'items-end text-right' : 'items-start text-left',
        className,
      )}
    >
      <span className="text-foreground">
        {formatServiceTimeModeLabel(service.timeMode, t)}
      </span>
      <span className="text-muted-foreground">{formatServiceScheduleSummary(service, t)}</span>
      {showPrice ? (
        <span className="font-medium tabular-nums text-foreground">
          {price != null ? formatProductListPrice(price) : '—'}
        </span>
      ) : null}
    </div>
  )
}
