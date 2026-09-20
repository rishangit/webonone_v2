import type { DataListQuery, PaginatedResult } from '@/shared/types/data.types'
import {
  DEFAULT_LIST_PAGE_SIZE,
  useServerPaginatedList,
} from '@/shared/hooks/useServerPaginatedList'

type FetchPage<T> = (query: DataListQuery) => Promise<PaginatedResult<T>>

export function usePaginatedEntityList<T>(fetchPage: FetchPage<T>) {
  const list = useServerPaginatedList<T>({
    fetchPage,
    pageSize: DEFAULT_LIST_PAGE_SIZE,
  })

  return {
    items: list.items,
    total: list.total,
    page: list.page,
    pageSize: list.pageSize,
    searchQuery: list.searchQuery,
    setSearchQuery: list.setSearchQuery,
    loading: list.loading,
    loadingMore: list.loadingMore,
    hasMore: list.hasMore,
    error: list.error,
    reload: list.reload,
    loadMore: list.loadMore,
  }
}
