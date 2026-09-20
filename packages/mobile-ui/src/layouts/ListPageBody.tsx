import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../lib/cn'

export interface ListPageBodyProps {
  children: ReactNode
  className?: string
}

/** Flex column that grows to fill the scroll area so `ListPageFooter` can sit at the bottom. */
export function ListPageBody({ children, className }: ListPageBodyProps) {
  return <View className={cn('min-h-0 flex-1 flex-col gap-6', className)}>{children}</View>
}
