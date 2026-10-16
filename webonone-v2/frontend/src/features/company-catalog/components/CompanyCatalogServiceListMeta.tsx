import { useTranslation } from 'react-i18next'
import { cn, PriceDisplay } from '@webonone/ui-kit'
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
      <div
        className={cn(
          'flex min-w-0 flex-wrap items-baseline gap-x-1.5',
          align === 'end' ? 'justify-end' : 'justify-start',
        )}
      >
        <span className="shrink-0 text-foreground">
          {formatCompanyServiceTimeModeLabel(time.timeMode, t)}
        </span>
        <span className="min-w-0 text-muted-foreground">
          {formatCompanyServiceScheduleSummary(item, t)}
        </span>
      </div>
      {showPrice ? (
        <PriceDisplay
          value={item.listPrice}
          compareAt={item.listPriceCompareAt}
          discountPercent={item.listDiscountPercent}
          size="sm"
          className={align === 'end' ? 'mt-auto' : undefined}
          align={align === 'end' ? 'right' : 'left'}
        />
      ) : null}
    </div>
  )
}
