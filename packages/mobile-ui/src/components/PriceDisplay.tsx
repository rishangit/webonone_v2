import { Text, View } from 'react-native'
import { cn } from '../lib/cn'
import { formatMoney, type FormatMoneyOptions } from '../lib/formatMoney'
import { PRICE_DISPLAY_TEXT_CLASS, type PriceDisplaySize } from '../lib/priceDisplaySizes'

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
}

const VARIANT_CLASS: Record<PriceDisplayVariant, string> = {
  default: 'text-foreground',
  cost: 'text-fixed-pending',
  sell: 'text-fixed-approved',
}

const COMPARE_TEXT_CLASS: Record<PriceDisplaySize, string> = {
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

export function PriceDisplay({
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
      <Text className={cn(PRICE_DISPLAY_TEXT_CLASS[size], VARIANT_CLASS[variant], className)}>
        {label}
      </Text>
    )
  }

  return (
    <View className={cn('flex-row flex-wrap items-baseline gap-x-1.5', className)}>
      <Text className={cn(PRICE_DISPLAY_TEXT_CLASS[size], VARIANT_CLASS[variant])}>{label}</Text>
      <Text className={cn(COMPARE_TEXT_CLASS[size], 'text-muted-foreground line-through')}>
        {formatMoney(discount.compareAt, formatOptions)}
      </Text>
      <Text className={cn(COMPARE_TEXT_CLASS[size], 'text-foreground')}>
        {formatDiscountPercent(discount.discountPercent)}
      </Text>
    </View>
  )
}
