import { View } from 'react-native'
import { cn } from '../lib/cn'
import type { PriceDisplaySize } from '../lib/priceDisplaySizes'
import { PriceDisplay } from './PriceDisplay'
import { Muted } from './Typography'

export type StockBatchPriceRowProps = {
  costLabel: string
  sellLabel: string
  costValue: number
  sellValue: number
  size?: PriceDisplaySize
  currency?: string
  className?: string
}

export function StockBatchPriceRow({
  costLabel,
  sellLabel,
  costValue,
  sellValue,
  size = 'sm',
  currency,
  className,
}: StockBatchPriceRowProps) {
  return (
    <View className={cn('flex-row flex-wrap items-baseline justify-end gap-x-4 gap-y-1', className)}>
      <View className="flex-row items-baseline gap-1">
        <Muted className="text-xs text-fixed-pending">{costLabel}</Muted>
        <PriceDisplay value={costValue} size={size} variant="cost" currency={currency} />
      </View>
      <View className="flex-row items-baseline gap-1">
        <Muted className="text-xs text-fixed-approved">{sellLabel}</Muted>
        <PriceDisplay value={sellValue} size={size} variant="sell" currency={currency} />
      </View>
    </View>
  )
}
