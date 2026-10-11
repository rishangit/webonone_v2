import { cn } from '../lib/utils'

export type StockBatchPriceRowProps = {
  costLabel: string
  sellLabel: string
  costValue: string
  sellValue: string
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
  className,
}: StockBatchPriceRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline justify-end gap-x-4 gap-y-1 text-sm tabular-nums',
        className,
      )}
    >
      <span className="text-fixed-pending">
        <span className="opacity-80">{costLabel}</span>{' '}
        <span className="font-semibold">{costValue}</span>
      </span>
      <span className="text-fixed-approved">
        <span className="opacity-80">{sellLabel}</span>{' '}
        <span className="font-semibold">{sellValue}</span>
      </span>
    </div>
  )
}

export { StockBatchPriceRow }
