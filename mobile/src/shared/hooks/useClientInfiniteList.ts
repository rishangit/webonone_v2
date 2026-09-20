import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_LIST_PAGE_SIZE } from '@/shared/hooks/useServerPaginatedList'

export function useClientInfiniteList<T>(items: T[], pageSize = DEFAULT_LIST_PAGE_SIZE, resetKey = '') {
  const [loadedCount, setLoadedCount] = useState(pageSize)

  useEffect(() => {
    setLoadedCount(pageSize)
  }, [resetKey, pageSize, items.length])

  const visibleItems = items.slice(0, loadedCount)
  const hasMore = loadedCount < items.length
  const loadingMore = false

  const loadMore = useCallback(() => {
    setLoadedCount((current) => Math.min(current + pageSize, items.length))
  }, [items.length, pageSize])

  return {
    visibleItems,
    totalCount: items.length,
    loadedCount: visibleItems.length,
    hasMore,
    loadingMore,
    loadMore,
  }
}
