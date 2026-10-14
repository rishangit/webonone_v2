import { View } from 'react-native'
import { cn } from '../lib/cn'
import { Muted } from './Typography'
import { PriceDisplay, type PriceDisplayProps } from './PriceDisplay'

export type ListPriceFieldProps = Omit<PriceDisplayProps, 'size'> & {
  label: string
  size?: PriceDisplayProps['size']
  className?: string
}

export function ListPriceField({
  label,
  value,
  size = 'lg',
  className,
  ...priceProps
}: ListPriceFieldProps) {
  return (
    <View className={cn('gap-1', className)}>
      <Muted className="text-xs font-medium normal-case tracking-normal">{label}</Muted>
      <PriceDisplay value={value} size={size} {...priceProps} />
    </View>
  )
}
