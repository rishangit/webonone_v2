import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'
import type { CatalogFeatureState, CatalogListQuery, PaginatedResult } from './types'
import { isFresh, serializeQuery } from './cacheUtils'

type ListLoader<T> = (query: CatalogListQuery) => Promise<PaginatedResult<T>>
type GetLoader<T> = (id: string) => Promise<T>
type CreateLoader<T> = (body: Record<string, unknown>) => Promise<T>
type UpdateLoader<T> = (id: string, body: Record<string, unknown>) => Promise<T>
type DeleteLoader = (id: string) => Promise<void>

export interface CatalogFeatureConfig<T> {
  name: string
  list: ListLoader<T>
  get: GetLoader<T>
  create: CreateLoader<T>
  update: UpdateLoader<T>
  delete: DeleteLoader
}

function initialCatalogState<T>(): CatalogFeatureState<T> {
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
    q: '',
    status: 'all',
    queryKey: '',
    lastFetchedAt: null,
    listStatus: 'idle',
    listError: null,
    detail: null,
    detailId: null,
    detailLastFetchedAt: null,
    detailStatus: 'idle',
    detailError: null,
  }
}

export function createCatalogFeatureStore<T>(config: CatalogFeatureConfig<T>) {
  const slice = createSlice({
    name: config.name,
    initialState: initialCatalogState<T>(),
    reducers: {
      loadListRequested(state, action: PayloadAction<CatalogListQuery>) {
        const page = action.payload.page ?? state.page
        const pageSize = action.payload.pageSize ?? state.pageSize
        const q = action.payload.q ?? state.q
        const status = action.payload.status ?? state.status
        const queryKey = serializeQuery({
          page,
          pageSize,
          q,
          status,
          ...action.payload.extra,
        })
        if (
          !action.payload.force &&
          state.queryKey === queryKey &&
          isFresh(state.lastFetchedAt)
        ) {
          return
        }
        state.listStatus = 'loading'
        state.listError = null
        if (action.payload.q !== undefined) state.q = action.payload.q
        if (action.payload.status !== undefined) state.status = action.payload.status ?? 'all'
        if (action.payload.page !== undefined) state.page = action.payload.page
        if (action.payload.pageSize !== undefined) state.pageSize = action.payload.pageSize
      },
      loadListSucceeded(
        state,
        action: PayloadAction<{
          queryKey: string
          items: T[]
          total: number
          page: number
          pageSize: number
        }>,
      ) {
        state.items = action.payload.items as typeof state.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
        state.queryKey = action.payload.queryKey
        state.lastFetchedAt = Date.now()
        state.listStatus = 'idle'
      },
      loadListFailed(state, action: PayloadAction<string>) {
        state.listStatus = 'error'
        state.listError = action.payload
      },
      fetchDetailRequested(state, action: PayloadAction<{ id: string; force?: boolean }>) {
        state.detailStatus = 'loading'
        state.detailError = null
        state.detailId = action.payload.id
      },
      fetchDetailSucceeded(state, action: PayloadAction<T>) {
        state.detail = action.payload as typeof state.detail
        state.detailLastFetchedAt = Date.now()
        state.detailStatus = 'idle'
      },
      fetchDetailFailed(state, action: PayloadAction<string>) {
        state.detailStatus = 'error'
        state.detailError = action.payload
      },
      saveDetailRequested(state, _action: PayloadAction<{ id?: string; body: Record<string, unknown> }>) {
        state.detailStatus = 'saving'
        state.detailError = null
      },
      saveDetailSucceeded(state, action: PayloadAction<T>) {
        state.detail = action.payload as typeof state.detail
        state.detailLastFetchedAt = Date.now()
        state.detailStatus = 'idle'
        state.lastFetchedAt = null
      },
      saveDetailFailed(state, action: PayloadAction<string>) {
        state.detailStatus = 'error'
        state.detailError = action.payload
      },
      deleteRequested(state, _action: PayloadAction<{ id: string }>) {
        state.detailStatus = 'saving'
        state.listError = null
      },
      deleteSucceeded(state, action: PayloadAction<string>) {
        state.items = state.items.filter((item) => (item as { id: string }).id !== action.payload)
        state.detailStatus = 'idle'
        state.lastFetchedAt = null
      },
      deleteFailed(state, action: PayloadAction<string>) {
        state.detailStatus = 'error'
        state.listError = action.payload
      },
      resetDetail(state) {
        state.detail = null
        state.detailId = null
        state.detailLastFetchedAt = null
        state.detailStatus = 'idle'
        state.detailError = null
      },
      clearCache(state) {
        Object.assign(state, initialCatalogState<T>())
      },
    },
  })

  const actions = slice.actions

  type RootStateWithFeature = { [K in typeof config.name]: CatalogFeatureState<T> }

  const loadListEpic: Epic = (action$, state$) =>
    action$.pipe(
      ofType(actions.loadListRequested.type),
      debounceTime(400),
      withLatestFrom(state$),
      filter(([action, state]) => {
        const payload = (action as ReturnType<typeof actions.loadListRequested>).payload
        const featureState = (state as unknown as RootStateWithFeature)[config.name]
        const queryKey = serializeQuery({
          page: payload.page ?? featureState.page,
          pageSize: payload.pageSize ?? featureState.pageSize,
          q: payload.q ?? featureState.q,
          status: payload.status ?? featureState.status,
          ...payload.extra,
        })
        if (payload.force) return true
        if (featureState.queryKey === queryKey && isFresh(featureState.lastFetchedAt)) {
          return false
        }
        return true
      }),
      distinctUntilChanged(
        ([a], [b]) =>
          serializeQuery((a as ReturnType<typeof actions.loadListRequested>).payload) ===
          serializeQuery((b as ReturnType<typeof actions.loadListRequested>).payload),
      ),
      switchMap(([action, state]) => {
        const payload = (action as ReturnType<typeof actions.loadListRequested>).payload
        const featureState = (state as unknown as RootStateWithFeature)[config.name]
        const query = {
          page: payload.page ?? featureState.page,
          pageSize: payload.pageSize ?? featureState.pageSize,
          q: (payload.q ?? featureState.q).trim() || undefined,
          status:
            (payload.status ?? featureState.status) === 'all'
              ? undefined
              : payload.status ?? featureState.status,
          ...payload.extra,
        }
        const queryKey = serializeQuery(query)
        return from(config.list(query)).pipe(
          map((result) =>
            actions.loadListSucceeded({
              queryKey,
              items: result.items,
              total: result.total,
              page: result.page,
              pageSize: query.pageSize ?? featureState.pageSize,
            }),
          ),
          catchError((err: Error) => of(actions.loadListFailed(err.message))),
        )
      }),
    )

  const fetchDetailEpic: Epic = (action$, state$) =>
    action$.pipe(
      ofType(actions.fetchDetailRequested.type),
      withLatestFrom(state$),
      filter(([action, state]) => {
        const payload = (action as ReturnType<typeof actions.fetchDetailRequested>).payload
        const featureState = (state as unknown as RootStateWithFeature)[config.name]
        if (payload.force) return true
        return !(
          featureState.detailId === payload.id &&
          featureState.detail &&
          isFresh(featureState.detailLastFetchedAt)
        )
      }),
      switchMap(([action]) => {
        const { id } = (action as ReturnType<typeof actions.fetchDetailRequested>).payload
        return from(config.get(id)).pipe(
          map((detail) => actions.fetchDetailSucceeded(detail)),
          catchError((err: Error) => of(actions.fetchDetailFailed(err.message))),
        )
      }),
    )

  const saveDetailEpic: Epic = (action$) =>
    action$.pipe(
      ofType(actions.saveDetailRequested.type),
      exhaustMap((action) => {
        const { id, body } = (action as ReturnType<typeof actions.saveDetailRequested>).payload
        const request = id ? config.update(id, body) : config.create(body)
        return from(request).pipe(
          map((detail) => actions.saveDetailSucceeded(detail)),
          catchError((err: Error) => of(actions.saveDetailFailed(err.message))),
        )
      }),
    )

  const deleteEpic: Epic = (action$) =>
    action$.pipe(
      ofType(actions.deleteRequested.type),
      exhaustMap((action) => {
        const { id } = (action as ReturnType<typeof actions.deleteRequested>).payload
        return from(config.delete(id)).pipe(
          map(() => actions.deleteSucceeded(id)),
          catchError((err: Error) => of(actions.deleteFailed(err.message))),
        )
      }),
    )

  const epics = combineEpics(loadListEpic, fetchDetailEpic, saveDetailEpic, deleteEpic)

  return {
    reducer: slice.reducer,
    actions,
    epics,
  }
}
