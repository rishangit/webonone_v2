import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'
import { isFresh, serializeQuery } from './cacheUtils'

export type PaginatedListQuery = {
  page?: number
  pageSize?: number
  status?: string
  force?: boolean
  extra?: Record<string, string | undefined>
}

export interface PaginatedFeatureState<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  status: string
  queryKey: string
  lastFetchedAt: number | null
  listStatus: 'idle' | 'loading' | 'error'
  listError: string | null
}

type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

type ListLoader<T> = (query: PaginatedListQuery & { page: number; pageSize: number }) => Promise<PaginatedResult<T>>

export interface PaginatedFeatureConfig<T> {
  name: string
  list: ListLoader<T>
  /** Shorter TTL for live data (e.g. queue polling). Defaults to 5 minutes. */
  cacheTtlMs?: number
}

function initialPaginatedState<T>(): PaginatedFeatureState<T> {
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
    status: 'all',
    queryKey: '',
    lastFetchedAt: null,
    listStatus: 'idle',
    listError: null,
  }
}

export function createPaginatedFeatureStore<T>(config: PaginatedFeatureConfig<T>) {
  const cacheTtlMs = config.cacheTtlMs ?? undefined

  const slice = createSlice({
    name: config.name,
    initialState: initialPaginatedState<T>(),
    reducers: {
      loadListRequested(state, action: PayloadAction<PaginatedListQuery>) {
        const page = action.payload.page ?? state.page
        const pageSize = action.payload.pageSize ?? state.pageSize
        const status = action.payload.status ?? state.status
        const queryKey = serializeQuery({
          page,
          pageSize,
          status,
          ...action.payload.extra,
        })
        if (
          !action.payload.force &&
          state.queryKey === queryKey &&
          isFresh(state.lastFetchedAt, cacheTtlMs)
        ) {
          return
        }
        state.listStatus = 'loading'
        state.listError = null
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
      clearCache(state) {
        Object.assign(state, initialPaginatedState<T>())
      },
    },
  })

  const actions = slice.actions

  type RootStateWithFeature = { [K in typeof config.name]: PaginatedFeatureState<T> }

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
          status: payload.status ?? featureState.status,
          ...payload.extra,
        })
        if (payload.force) return true
        if (
          featureState.queryKey === queryKey &&
          isFresh(featureState.lastFetchedAt, cacheTtlMs)
        ) {
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
        const page = payload.page ?? featureState.page
        const pageSize = payload.pageSize ?? featureState.pageSize
        const status = payload.status ?? featureState.status
        const query = {
          page,
          pageSize,
          status: status === 'all' ? undefined : status,
          force: payload.force,
          extra: payload.extra,
        }
        const queryKey = serializeQuery({
          page,
          pageSize,
          status,
          ...payload.extra,
        })
        return from(config.list(query)).pipe(
          map((result) =>
            actions.loadListSucceeded({
              queryKey,
              items: result.items,
              total: result.total,
              page: result.page,
              pageSize: result.pageSize,
            }),
          ),
          catchError((err: Error) => of(actions.loadListFailed(err.message))),
        )
      }),
    )

  const epics = combineEpics(loadListEpic)

  return {
    reducer: slice.reducer,
    actions,
    epics,
  }
}
