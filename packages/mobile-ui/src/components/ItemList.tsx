import { Pressable, View } from 'react-native'
import { cn } from '../lib/cn'
import { Body } from './Typography'

/** Leading entity image in a list row (logo, avatar, catalog thumb). */
export const itemListThumbClassName = 'h-14 w-14 shrink-0 self-start rounded-md'

export function ItemList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <View className={cn('gap-2 py-4', className)}>{children}</View>
}

export function ItemListItem({
  children,
  onPress,
  selected,
}: {
  children: React.ReactNode
  onPress?: () => void
  selected?: boolean
}) {
  const className = cn(
    'flex-row items-start gap-3 rounded-md border bg-card p-2',
    selected ? 'border-primary' : 'border-input-border',
  )

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} className={className}>
        {children}
      </Pressable>
    )
  }

  return <View className={className}>{children}</View>
}

export function ItemListContent({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string | null
}) {
  return (
    <View className="min-w-0 flex-1">
      <Body className="text-sm font-semibold">{title}</Body>
      {subtitle ? <Body className="text-sm text-muted">{subtitle}</Body> : null}
    </View>
  )
}

export function ItemListEmpty({ children }: { children: React.ReactNode }) {
  return (
    <View className="items-center py-4">
      <Body className="text-sm text-muted">{children}</Body>
    </View>
  )
}
