import { View } from 'react-native'
import { cn } from '../lib/cn'
import { Spinner } from './Spinner'
import { Body } from './Typography'

export interface ListPageFooterProps {
  loadedCount: number
  totalCount: number
  hasMore?: boolean
  loadingMore?: boolean
  className?: string
  /** Override the default “Showing X of Y” summary. */
  summary?: string
}

/** On-scroll list footer — summary row + optional loading-more spinner. Scroll detection lives in `useScrollLoadMore`. */
export function ListPageFooter({
  loadedCount,
  totalCount,
  hasMore = false,
  loadingMore = false,
  className,
  summary,
}: ListPageFooterProps) {
  const resolvedSummary =
    summary ?? (totalCount === 0 ? 'Showing 0 of 0' : `Showing ${loadedCount} of ${totalCount}`)

  if (totalCount === 0 && !loadingMore) {
    return null
  }

  return (
    <View className={cn('mt-auto shrink-0 gap-2 pb-4 pt-2', className)}>
      <View className="flex-row items-center justify-between gap-2">
        <Body className="text-sm text-muted">{resolvedSummary}</Body>
        {loadingMore ? <Spinner size="small" /> : null}
      </View>
      {hasMore && !loadingMore ? (
        <View className="h-1 w-full" accessibilityElementsHidden importantForAccessibility="no" />
      ) : null}
    </View>
  )
}
