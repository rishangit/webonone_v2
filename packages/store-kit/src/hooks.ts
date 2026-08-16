import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { ActionCreatorWithPayload } from '@reduxjs/toolkit'
import type { CatalogFeatureState, CatalogListQuery } from './types'
import { isFresh, serializeQuery } from './cacheUtils'

export type CatalogListActions = {
  loadListRequested: ActionCreatorWithPayload<CatalogListQuery>
}

export type CatalogEditorActions = {
  fetchDetailRequested: ActionCreatorWithPayload<{ id: string; force?: boolean }>
  saveDetailRequested: ActionCreatorWithPayload<{ id?: string; body: Record<string, unknown> }>
  resetDetail: ActionCreatorWithPayload<void>
}

export function useEpicCatalogList<T, S = unknown>(
  selectState: (state: S) => CatalogFeatureState<T>,
  actions: CatalogListActions,
) {
  const dispatch = useDispatch()
  const listState = useSelector(selectState)
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

  const loadMore = useCallback(() => {
    if (listState.listStatus === 'loading') return
    if (listState.items.length >= listState.total) return
    const nextPage = (listState.page || 1) + 1
    dispatch(actions.loadListRequested({ ...buildQuery(nextPage), append: true }))
  }, [actions, buildQuery, dispatch, listState.items.length, listState.listStatus, listState.page, listState.total])

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
    loading:
      listState.lastFetchedAt === null
        ? listState.listStatus !== 'error'
        : listState.listStatus === 'loading' && listState.items.length === 0,
    loadingMore: listState.listStatus === 'loading' && listState.items.length > 0,
    hasMore: listState.items.length < listState.total,
    error: listState.listError,
    filterOpen,
    setFilterOpen,
    load,
    loadMore,
    setPage: (p: number) => load(p),
    setPageSize,
    hasActiveFilters: status !== 'all' || Object.keys(extraFilters).length > 0,
  }
}

export function useEpicCatalogEditor<T, S = unknown>(
  id: string | undefined,
  isNew: boolean,
  selectState: (state: S) => CatalogFeatureState<T>,
  actions: CatalogEditorActions,
) {
  const dispatch = useDispatch()
  const featureState = useSelector(selectState)

  useEffect(() => {
    if (isNew || !id) {
      dispatch(actions.resetDetail())
      return
    }
    dispatch(actions.fetchDetailRequested({ id }))
  }, [actions, dispatch, id, isNew])

  const save = (body: Record<string, unknown>) => {
    dispatch(actions.saveDetailRequested({ id: isNew ? undefined : id, body }))
  }

  return {
    detail: featureState.detail,
    loading: featureState.detailStatus === 'loading',
    saving: featureState.detailStatus === 'saving',
    error: featureState.detailError,
    save,
  }
}
