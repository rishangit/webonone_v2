import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'

export const DEFAULT_LIST_PAGE_SIZE = 12

export interface PaginatedFetchResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type ServerListQuery = Record<string, string | number | undefined>

export function useServerPaginatedList<T>({
  fetchPage,
  pageSize = DEFAULT_LIST_PAGE_SIZE,
  debounceMs = 400,
}: {
  fetchPage: (query: ServerListQuery) => Promise<PaginatedFetchResult<T>>
  pageSize?: number
  debounceMs?: number
}) {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [queryParams, setQueryParams] = useState<ServerListQuery>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const pageRef = useRef(1)
  const itemsRef = useRef<T[]>([])
  const queryRef = useRef({ searchQuery, queryParams, pageSize })
  const fetchPageRef = useRef(fetchPage)

  fetchPageRef.current = fetchPage
  queryRef.current = { searchQuery, queryParams, pageSize }
  pageRef.current = page
  itemsRef.current = items

  const runFetch = useCallback(async (nextPage: number, mode: 'replace' | 'append') => {
      const requestId = ++requestRef.current
      const isAppend = mode === 'append'
      if (isAppend) {
        if (loadingMoreRef.current) return
        loadingMoreRef.current = true
        setLoadingMore(true)
      } else {
        setError(null)
        if (itemsRef.current.length === 0) {
          setLoading(true)
        }
      }

      const { searchQuery: q, queryParams: extra, pageSize: size } = queryRef.current

      try {
        const result = await fetchPageRef.current({
          ...extra,
          q: q.trim() || undefined,
          page: nextPage,
          pageSize: size,
        })
        if (requestId !== requestRef.current) return
        setTotal(result.total)
        setPage(result.page)
        setItems((current) =>
          isAppend ? [...current, ...result.items] : result.items,
        )
        setError(null)
      } catch (err) {
        if (requestId !== requestRef.current) return
        if (!isAppend) {
          setItems([])
          setTotal(0)
        }
        setError(err instanceof Error ? err.message : 'Failed to load items')
      } finally {
        if (requestId === requestRef.current) {
          if (isAppend) {
            loadingMoreRef.current = false
            setLoadingMore(false)
          } else {
            setLoading(false)
          }
        }
      }
    }, [])

  const reload = useCallback(() => {
    void runFetch(1, 'replace')
  }, [runFetch])

  const patchQueryParams = useCallback((patch: ServerListQuery) => {
    setQueryParams((current) => ({ ...current, ...patch }))
  }, [])

  const hasMore = items.length < total
  const hasMoreRef = useRef(hasMore)
  hasMoreRef.current = hasMore

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return
    void runFetch(pageRef.current + 1, 'append')
  }, [runFetch])

  const skipDebouncedFetchRef = useRef(true)

  useFocusEffect(
    useCallback(() => {
      void runFetch(1, 'replace')
    }, [runFetch]),
  )

  useEffect(() => {
    if (skipDebouncedFetchRef.current) {
      skipDebouncedFetchRef.current = false
      return
    }
    const handle = setTimeout(() => {
      void runFetch(1, 'replace')
    }, debounceMs)
    return () => clearTimeout(handle)
  }, [searchQuery, queryParams, pageSize, debounceMs, runFetch])

  return {
    items,
    total,
    page,
    pageSize,
    searchQuery,
    setSearchQuery,
    queryParams,
    setQueryParams,
    loading,
    loadingMore,
    hasMore,
    error,
    reload,
    loadMore,
    patchQueryParams,
  }
}
