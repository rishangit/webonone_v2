import { useCallback, useEffect, useState } from 'react'
import { useListPageMode } from './ListPageModeContext'
import { nextVisibleCount } from './listPageScroll'

export function useClientListPage<T>(items: T[], initialPageSize = 12) {
  const mode = useListPageMode()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [loadedCount, setLoadedCount] = useState(initialPageSize)

  useEffect(() => {
    setPage(1)
    setLoadedCount(pageSize)
  }, [items, pageSize, mode])

  const total = items.length
  const visible =
    mode === 'on-scroll'
      ? items.slice(0, loadedCount)
      : items.slice((page - 1) * pageSize, page * pageSize)

  const loadMore = useCallback(() => {
    setLoadedCount((current) => nextVisibleCount(current, pageSize, total))
  }, [pageSize, total])

  const handlePageSizeChange = useCallback((nextSize: number) => {
    setPageSize(nextSize)
    setPage(1)
    setLoadedCount(nextSize)
  }, [])

  return {
    visible,
    page,
    pageSize,
    total,
    loadedCount: mode === 'on-scroll' ? Math.min(loadedCount, total) : visible.length,
    hasMore: loadedCount < total,
    loadMore,
    setPage,
    setPageSize: handlePageSizeChange,
  }
}
