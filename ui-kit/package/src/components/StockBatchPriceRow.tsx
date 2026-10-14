import { cn } from '../lib/utils'
import type { PriceDisplaySize } from '../lib/priceDisplaySizes'
import { PriceDisplay } from './PriceDisplay'

export type StockBatchPriceRowProps = {
  costLabel: string
  sellLabel: string
  costValue: number
  sellValue: number
  size?: PriceDisplaySize
  currency?: string
  className?: string
}

/**
 * Trailing stock batch prices — right-aligned; cost uses fixed pending, sell uses fixed approved.
 */
function StockBatchPriceRow({
  costLabel,
  sellLabel,
  costValue,
  sellValue,
  size = 'sm',
  currency,
  className,
}: StockBatchPriceRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline justify-end gap-x-4 gap-y-1',
        className,
      )}
    >
      <span className="text-fixed-pending">
        <span className="text-xs opacity-80">{costLabel}</span>{' '}
        <PriceDisplay
          value={costValue}
          size={size}
          variant="cost"
          currency={currency}
          className="inline"
        />
      </span>
      <span className="text-fixed-approved">
        <span className="text-xs opacity-80">{sellLabel}</span>{' '}
        <PriceDisplay
          value={sellValue}
          size={size}
          variant="sell"
          currency={currency}
          className="inline"
        />
      </span>
    </div>
  )
}

export { StockBatchPriceRow }
