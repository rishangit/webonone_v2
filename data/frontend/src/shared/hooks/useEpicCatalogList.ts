import { useCallback, useEffect, useState } from 'react'
import type { ActionCreatorWithPayload } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import type { CatalogFeatureState, CatalogListQuery } from '@/shared/store/createCatalogFeatureStore'
import { isFresh, serializeQuery } from '@/shared/store/cacheUtils'

type CatalogActions = {
  loadListRequested: ActionCreatorWithPayload<CatalogListQuery>
}

export function useEpicCatalogList<T>(
  selectState: (state: RootState) => CatalogFeatureState<T>,
  actions: CatalogActions,
) {
  const dispatch = useAppDispatch()
  const listState = useAppSelector(selectState)
  const [q, setQ] = useState(listState.q || '')
  const [status, setStatus] = useState(listState.status || 'all')
  const [pageSize, setPageSize] = useState(listState.pageSize || 12)
  const [filterOpen, setFilterOpen] = useState(false)
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({})

  const buildQuery = useCallback(
    (nextPage: number, nextPageSize = pageSize): CatalogListQuery => ({
      page: nextPage,
      pageSize: nextPageSize,
      q,
      status,
      extra: extraFilters,
    }),
    [extraFilters, pageSize, q, status],
  )

  const dispatchLoad = useCallback(
    (nextPage: number, nextPageSize = pageSize, force = false) => {
      const query = buildQuery(nextPage, nextPageSize)
      const queryKey = serializeQuery({ ...query, extra: query.extra })
      if (
        !force &&
        listState.queryKey === queryKey &&
        isFresh(listState.lastFetchedAt)
      ) {
        return
      }
      dispatch(actions.loadListRequested({ ...query, force }))
    },
    [actions, buildQuery, dispatch, listState.lastFetchedAt, listState.queryKey, pageSize],
  )

  useEffect(() => {
    dispatchLoad(1)
  }, [q, status, extraFilters, dispatchLoad])

  const load = useCallback(
    (nextPage = listState.page || 1, nextPageSize = pageSize, force = false) => {
      if (nextPageSize !== pageSize) setPageSize(nextPageSize)
      dispatchLoad(nextPage, nextPageSize, force)
    },
    [dispatchLoad, listState.page, pageSize],
  )

  return {
    items: listState.items,
    page: listState.page || 1,
    pageSize: listState.pageSize || pageSize,
    total: listState.total,
    q,
    setQ,
    status,
    setStatus,
    extraFilters,
    setExtraFilters,
    loading: listState.listStatus === 'loading' && listState.items.length === 0,
    error: listState.listError,
    filterOpen,
    setFilterOpen,
    load,
    setPage: (p: number) => load(p),
    setPageSize,
    hasActiveFilters: status !== 'all' || Object.keys(extraFilters).length > 0,
  }
}
