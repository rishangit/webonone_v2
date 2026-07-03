import { useCallback, useEffect, useState } from 'react'
import type { PaginatedResult } from '@/shared/types/data.types'

type Loader<T> = (query: {
  page: number
  pageSize: number
  q?: string
  status?: string
  extra?: Record<string, string>
}) => Promise<PaginatedResult<T>>

export function usePaginatedList<T>(loader: Loader<T>, deps: unknown[] = []) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const load = useCallback(
    async (nextPage = page, nextPageSize = pageSize) => {
      setLoading(true)
      setError(null)
      try {
        const data = await loader({
          page: nextPage,
          pageSize: nextPageSize,
          q: q.trim() || undefined,
          status: status === 'all' ? undefined : status,
          extra: extraFilters,
        })
        setItems(data.items)
        setTotal(data.total)
        setPage(data.page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [loader, page, pageSize, q, status, extraFilters],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(1)
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, extraFilters, ...deps])

  return {
    items,
    page,
    pageSize,
    total,
    q,
    setQ,
    status,
    setStatus,
    extraFilters,
    setExtraFilters,
    loading,
    error,
    filterOpen,
    setFilterOpen,
    load,
    setPage,
    setPageSize,
    hasActiveFilters: status !== 'all' || Object.keys(extraFilters).length > 0,
  }
}
