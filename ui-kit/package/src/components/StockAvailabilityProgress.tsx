import { cn } from '../lib/utils'
import { Progress } from './Progress'

export type StockAvailabilityProgressSize = 'full' | 'compact'

export type StockAvailabilityProgressProps = {
  quantity: number
  maxQuantity?: number | null
  minQuantity?: number | null
  className?: string
  /**
   * `full` — track spans container width (default).
   * `compact` — fixed track width for list rows (`w-48` / `sm:w-52`).
   */
  size?: StockAvailabilityProgressSize
  /** When `compact`, aligns the block to the trailing edge of the row. */
  align?: 'start' | 'end'
  /** Shown above the bar (e.g. batch name). */
  title?: string
  /** Right side caption (e.g. "12 / 100"). When omitted, derived from quantity and max. */
  caption?: string
}

/** Tailwind width for `size="compact"` — reuse when wrapping the component manually. */
export const STOCK_AVAILABILITY_PROGRESS_COMPACT_CLASS = 'w-48 max-w-full sm:w-52'

function formatQty(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

function resolveProgressPercent(quantity: number, maxQuantity: number | null | undefined): number {
  if (maxQuantity != null && maxQuantity > 0) {
    return Math.min(100, (quantity / maxQuantity) * 100)
  }
  if (quantity <= 0) return 0
  return 100
}

function resolveCaption(
  quantity: number,
  maxQuantity: number | null | undefined,
  caption?: string,
): string {
  if (caption) return caption
  if (maxQuantity != null && maxQuantity > 0) {
    return `${formatQty(quantity)} / ${formatQty(maxQuantity)}`
  }
  return formatQty(quantity)
}

function StockAvailabilityProgress({
  quantity,
  maxQuantity,
  minQuantity,
  className,
  size = 'full',
  align = 'start',
  title,
  caption,
}: StockAvailabilityProgressProps) {
  const percent = resolveProgressPercent(quantity, maxQuantity)
  const belowMin = minQuantity != null && quantity < minQuantity
  const outOfStock = quantity <= 0

  const indicatorClassName = outOfStock
    ? 'bg-muted-foreground/35'
    : belowMin
      ? 'bg-amber-500 dark:bg-amber-600'
      : undefined

  const isCompact = size === 'compact'

  return (
    <div
      className={cn(
        'space-y-1.5',
        isCompact && STOCK_AVAILABILITY_PROGRESS_COMPACT_CLASS,
        isCompact && align === 'end' && 'ml-auto',
        !isCompact && 'stock-availability-progress-full',
        className,
      )}
    >
      {title ? (
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="min-w-0 truncate font-medium text-foreground">{title}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {resolveCaption(quantity, maxQuantity, caption)}
          </span>
        </div>
      ) : (
        <p
          className={cn(
            'text-xs tabular-nums text-muted-foreground',
            isCompact ? 'text-right' : 'text-left',
          )}
        >
          {resolveCaption(quantity, maxQuantity, caption)}
        </p>
      )}
      <Progress
        value={percent}
        indicatorClassName={indicatorClassName}
        className={!isCompact ? 'min-w-0' : undefined}
      />
    </div>
  )
}

export { StockAvailabilityProgress }
