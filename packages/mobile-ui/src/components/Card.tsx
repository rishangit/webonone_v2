import { View, type ViewProps } from 'react-native'
import { cn } from '../lib/cn'

export function Card({
  className,
  compact,
  ...props
}: ViewProps & { compact?: boolean }) {
  return (
    <View
      className={cn(
        'rounded-lg border border-border bg-card',
        compact ? 'p-0' : 'p-4',
        className,
      )}
      {...props}
    />
  )
}
