import { useCallback, useEffect, useRef, useState } from 'react'
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

export type CatalogListFilterOverride = Partial<{
  q: string
  status: string
  extra: Record<string, string>
}>

export function useEpicCatalogList<T, S = unknown>(
  selectState: (state: S) => CatalogFeatureState<T>,
  actions: CatalogListActions,
  options?: { initialExtra?: Record<string, string> },
) {
  const dispatch = useDispatch()
  const listState = useSelector(selectState)
  const [q, setQ] = useState(listState.q || '')
  const [status, setStatus] = useState(listState.status || 'all')
  const [pageSize, setPageSize] = useState(listState.pageSize || 12)
  const [filterOpen, setFilterOpen] = useState(false)
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>(
    options?.initialExtra ?? {},
  )
  const listStateRef = useRef(listState)
  listStateRef.current = listState

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
    (
      nextPage: number,
      nextPageSize = pageSize,
      force = false,
      filterOverride?: CatalogListFilterOverride,
    ) => {
      const current = listStateRef.current
      const query: CatalogListQuery = {
        page: nextPage,
        pageSize: nextPageSize,
        q: filterOverride?.q ?? q,
        status: filterOverride?.status ?? status,
        extra: filterOverride?.extra ?? extraFilters,
      }
      const queryKey = serializeQuery({ ...query, extra: query.extra })
      if (!force && current.queryKey === queryKey && isFresh(current.lastFetchedAt)) {
        return
      }
      dispatch(actions.loadListRequested({ ...query, force }))
    },
    [actions, dispatch, extraFilters, pageSize, q, status],
  )

  // Reload page 1 when filters or page size change. Cache timestamps must not be
  // in dispatchLoad's identity — a completed page-2 fetch would otherwise bounce back to page 1.
  useEffect(() => {
    dispatchLoad(1)
  }, [dispatchLoad])

  const load = useCallback(
    (
      nextPage = listState.page || 1,
      nextPageSize = pageSize,
      force = false,
      filterOverride?: CatalogListFilterOverride,
    ) => {
      if (nextPageSize !== pageSize) setPageSize(nextPageSize)
      dispatchLoad(nextPage, nextPageSize, force, filterOverride)
    },
    [dispatchLoad, listState.page, pageSize],
  )

  const loadMore = useCallback(() => {
    if (listState.listStatus === 'loading') return
    if (listState.items.length >= listState.total) return
    const size = listState.pageSize || pageSize
    const maxPage = Math.max(1, Math.ceil(listState.total / size))
    if ((listState.page || 1) >= maxPage) return
    const nextPage = (listState.page || 1) + 1
    dispatch(actions.loadListRequested({ ...buildQuery(nextPage), append: true }))
  }, [
    actions,
    buildQuery,
    dispatch,
    listState.items.length,
    listState.listStatus,
    listState.page,
    listState.pageSize,
    listState.total,
    pageSize,
  ])

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
