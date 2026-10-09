import { createContext, useContext } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../lib/cn'
import { useInsideCard } from './Card'
import { Body } from './Typography'

/** Leading entity image in a list row (logo, avatar, catalog thumb). */
export const itemListThumbClassName = 'h-14 w-14 shrink-0 self-start rounded-md'

const ItemListNestContext = createContext(false)

export function ItemList({
  children,
  className,
  nestedInCard = false,
}: {
  children: React.ReactNode
  className?: string
  /** Borderless rows when the list sits inside a `Card` / `EditableSectionCard`. */
  nestedInCard?: boolean
}) {
  return (
    <ItemListNestContext.Provider value={nestedInCard}>
      <View className={cn('gap-2 py-4', className)}>{children}</View>
    </ItemListNestContext.Provider>
  )
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
  const nestedInCard = useContext(ItemListNestContext) || useInsideCard()
  const className = cn(
    'flex-row items-start gap-3 rounded-md bg-card p-2',
    nestedInCard ? 'border-0' : 'border',
    !nestedInCard && (selected ? 'border-primary' : 'border-input-border'),
    nestedInCard && selected && 'bg-muted',
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
