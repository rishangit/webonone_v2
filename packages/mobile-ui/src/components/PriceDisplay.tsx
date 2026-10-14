import { Text } from 'react-native'
import { cn } from '../lib/cn'
import { formatMoney, type FormatMoneyOptions } from '../lib/formatMoney'
import { PRICE_DISPLAY_TEXT_CLASS, type PriceDisplaySize } from '../lib/priceDisplaySizes'

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
}

const VARIANT_CLASS: Record<PriceDisplayVariant, string> = {
  default: 'text-foreground',
  cost: 'text-fixed-pending',
  sell: 'text-fixed-approved',
}

export function PriceDisplay({
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
    <Text
      className={cn(
        PRICE_DISPLAY_TEXT_CLASS[size],
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {label}
    </Text>
  )
}
