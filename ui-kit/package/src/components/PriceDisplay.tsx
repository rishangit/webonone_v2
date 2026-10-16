import { cn } from '../lib/utils'
import { formatMoney, type FormatMoneyOptions } from '../lib/formatMoney'
import {
  PRICE_DISPLAY_SIZE_CLASSES,
  type PriceDisplaySize,
} from '../lib/priceDisplaySizes'

export type PriceDisplayVariant = 'default' | 'cost' | 'sell'

export type PriceDisplayProps = {
  value: number | null | undefined
  /** Previous price, shown struck through when a discount applies. */
  compareAt?: number | null
  /** Discount percent shown beside the struck-through price. */
  discountPercent?: number | null
  size?: PriceDisplaySize
  variant?: PriceDisplayVariant
  currency?: string
  minorUnits?: boolean
  amountOnly?: boolean
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
  empty?: string
  className?: string
  align?: 'left' | 'right'
}

const VARIANT_CLASSES: Record<PriceDisplayVariant, string> = {
  default: 'text-foreground',
  cost: 'text-fixed-pending',
  sell: 'text-fixed-approved',
}

const COMPARE_SIZE_CLASSES: Record<PriceDisplaySize, string> = {
  sm: 'text-xs font-medium tabular-nums',
  md: 'text-xs font-medium tabular-nums',
  lg: 'text-sm font-medium tabular-nums',
}

function formatDiscountPercent(percent: number): string {
  return `${Math.round(percent * 100) / 100}%`
}

function appliedDiscount(
  compareAt: number | null | undefined,
  discountPercent: number | null | undefined,
): { compareAt: number; discountPercent: number } | null {
  if (
    typeof compareAt !== 'number' ||
    !Number.isFinite(compareAt) ||
    typeof discountPercent !== 'number' ||
    !Number.isFinite(discountPercent) ||
    discountPercent <= 0
  ) {
    return null
  }
  return { compareAt, discountPercent }
}

function PriceDisplay({
  value,
  compareAt,
  discountPercent,
  size = 'md',
  variant = 'default',
  currency,
  minorUnits,
  amountOnly,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
  empty,
  className,
  align,
}: PriceDisplayProps) {
  const formatOptions: FormatMoneyOptions = {
    currency,
    minorUnits,
    amountOnly,
    minimumFractionDigits,
    maximumFractionDigits,
    locale,
    empty,
  }

  const label = formatMoney(value, formatOptions)
  const discount = appliedDiscount(compareAt, discountPercent)

  if (!discount) {
    return (
      <span
        className={cn(
          'inline-block',
          PRICE_DISPLAY_SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          align === 'right' && 'text-right',
          className,
        )}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex max-w-full flex-wrap items-baseline gap-x-1.5',
        align === 'right' && 'justify-end text-right',
        className,
      )}
    >
      <span className={cn(PRICE_DISPLAY_SIZE_CLASSES[size], VARIANT_CLASSES[variant])}>{label}</span>
      <span className={cn(COMPARE_SIZE_CLASSES[size], 'text-muted-foreground line-through')}>
        {formatMoney(discount.compareAt, formatOptions)}
      </span>
      <span className={cn(COMPARE_SIZE_CLASSES[size], 'text-foreground')}>
        {formatDiscountPercent(discount.discountPercent)}
      </span>
    </span>
  )
}

export { PriceDisplay, formatMoney as formatPriceDisplayText }
