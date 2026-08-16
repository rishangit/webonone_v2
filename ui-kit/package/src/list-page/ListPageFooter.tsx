import { cn } from '../lib/utils'
import { Pagination, type PaginationProps } from '../components/Pagination'
import { useListPageModeReload, useOnScrollLoadMore } from './useListPageScroll'

export interface ListPageFooterProps extends PaginationProps {
  loadedCount?: number
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  onModeChange?: () => void
  scrollRoot?: Element | null
}

function ListPageFooter({
  totalCount,
  currentPage,
  pageSize,
  loadedCount,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onModeChange,
  scrollRoot,
  className,
  id,
  ...paginationProps
}: ListPageFooterProps) {
  const mode = useListPageModeReload(() => {
    onModeChange?.()
  })

  const sentinelRef = useOnScrollLoadMore({
    enabled: mode === 'on-scroll',
    hasMore,
    loadingMore,
    onLoadMore,
    scrollRoot,
  })

  if (mode === 'pagination') {
    return (
      <Pagination
        id={id}
        className={className}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        {...paginationProps}
      />
    )
  }

  const shown =
    loadedCount ?? Math.min(Math.max(currentPage, 1) * Math.max(pageSize, 1), totalCount)
  const summary =
    totalCount === 0 ? 'Showing 0 of 0' : `Showing ${shown} of ${totalCount}`

  return (
    <div id={id} className={cn('shrink-0 pb-4 sm:pb-6', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{summary}</p>
        {loadingMore ? <p className="text-sm text-muted-foreground">Loading more…</p> : null}
      </div>
      {hasMore ? <div ref={sentinelRef} className="h-1 w-full" aria-hidden /> : null}
    </div>
  )
}

export { ListPageFooter }
