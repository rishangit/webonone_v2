import { useScrollLoadMore } from '@webonone/mobile-ui'

export function useListPageScroll({
  hasMore,
  loadingMore,
  loadMore,
}: {
  hasMore: boolean
  loadingMore: boolean
  loadMore: () => void
}) {
  return useScrollLoadMore({
    hasMore,
    loadingMore,
    onLoadMore: loadMore,
  })
}
