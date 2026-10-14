import { cn } from '../lib/utils'
import { formatMoney, type FormatMoneyOptions } from '../lib/formatMoney'
import {
  PRICE_DISPLAY_SIZE_CLASSES,
  type PriceDisplaySize,
} from '../lib/priceDisplaySizes'

export type PriceDisplayVariant = 'default' | 'cost' | 'sell'

export type PriceDisplayProps = {
  value: number | null | undefined
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

function PriceDisplay({
  value,
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

export { PriceDisplay, formatMoney as formatPriceDisplayText }
