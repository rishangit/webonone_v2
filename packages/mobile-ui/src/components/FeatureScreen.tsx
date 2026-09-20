import type { ReactNode } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { ScrollView, View } from 'react-native'
import { cn } from '../lib/cn'
import { PageHeader } from '../layouts/PageHeader'
import { emitListPageOutsidePress } from '../layouts/pageHeaderSearchContext'

export interface FeatureScreenProps {
  title?: string
  description?: string
  actions?: ReactNode
  onBack?: () => void
  backLabel?: string
  header?: ReactNode
  children: ReactNode
  scroll?: boolean
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  scrollEventThrottle?: number
  className?: string
}

export function FeatureScreen({
  title,
  description,
  actions,
  onBack,
  backLabel,
  header,
  children,
  scroll = true,
  onScroll,
  scrollEventThrottle = 16,
  className,
}: FeatureScreenProps) {
  function handleTouchStart() {
    emitListPageOutsidePress()
  }

  const headerNode =
    header ??
    (title ? (
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        onBack={onBack}
        backLabel={backLabel}
      />
    ) : null)

  if (!scroll) {
    return (
      <View
        className={cn('flex-1 gap-3 bg-background px-2 py-4', className)}
        onTouchStart={handleTouchStart}
      >
        {headerNode}
        <View className="min-h-0 flex-1">{children}</View>
      </View>
    )
  }

  return (
    <ScrollView
      className={cn('flex-1 bg-background', className)}
      contentContainerClassName="flex-grow gap-3 px-2 py-4"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      onTouchStart={handleTouchStart}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
    >
      {headerNode}
      {children}
    </ScrollView>
  )
}
