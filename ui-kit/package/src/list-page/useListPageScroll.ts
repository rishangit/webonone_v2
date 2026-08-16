import { useEffect, useRef } from 'react'
import { useListPageMode } from './ListPageModeContext'
import { getListPageScrollRoot } from './listPageScroll'
import type { ListPageMode } from './listPageMode'

export function useListPageModeReload(reload: () => void): ListPageMode {
  const mode = useListPageMode()
  const previousMode = useRef(mode)

  useEffect(() => {
    if (previousMode.current === mode) return
    previousMode.current = mode
    reload()
  }, [mode, reload])

  return mode
}

export function useOnScrollLoadMore({
  enabled,
  hasMore,
  loadingMore,
  onLoadMore,
  scrollRoot,
}: {
  enabled: boolean
  hasMore: boolean
  loadingMore: boolean
  onLoadMore?: () => void
  scrollRoot?: Element | null
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled || !hasMore || loadingMore || !onLoadMore) return
    const target = sentinelRef.current
    if (!target) return

    const root = getListPageScrollRoot(scrollRoot)
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore()
        }
      },
      { root, rootMargin: '120px', threshold: 0 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, hasMore, loadingMore, onLoadMore, scrollRoot])

  return sentinelRef
}
