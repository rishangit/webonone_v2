import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, merge, of, timer } from 'rxjs'
import {
  catchError,
  debounce,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'
import type { PaginatedFeatureState, PaginatedListQuery, PaginatedResult } from './types'
import { isFresh, serializeQuery } from './cacheUtils'
import { mergeAppendedItems } from './mergeAppendedItems'
import { isCollapsedReplaceRequest, resolveListPage } from './resolveListPage'

type ListLoader<T> = (
  query: PaginatedListQuery & { page: number; pageSize: number },
) => Promise<PaginatedResult<T>>

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
        const page = resolveListPage(action.payload, state)
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
        if (!action.payload.append) {
          state.page = page
        }
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
          append?: boolean
        }>,
      ) {
        const incoming = action.payload.items as typeof state.items
        state.items =
          action.payload.append && action.payload.page > 1
            ? (mergeAppendedItems(state.items, incoming) as typeof state.items)
            : incoming
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

  const loadListEpic: Epic = (action$, state$) => {
    const toRequest = (action: ReturnType<typeof actions.loadListRequested>, state: unknown) => {
      const payload = action.payload
      const featureState = (state as RootStateWithFeature)[config.name]
      const page = resolveListPage(payload, featureState)
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
      const append = Boolean(payload.append && page > 1)
      return from(config.list(query)).pipe(
        map((result) =>
          actions.loadListSucceeded({
            queryKey,
            items: result.items,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            append,
          }),
        ),
        catchError((err: Error) => of(actions.loadListFailed(err.message))),
      )
    }

    const prepared$ = action$.pipe(
      ofType(actions.loadListRequested.type),
      withLatestFrom(state$),
      filter(([action, state]) => {
        const payload = (action as ReturnType<typeof actions.loadListRequested>).payload
        const featureState = (state as unknown as RootStateWithFeature)[config.name]
        const queryKey = serializeQuery({
          page: resolveListPage(payload, featureState),
          pageSize: payload.pageSize ?? featureState.pageSize,
          status: payload.status ?? featureState.status,
          ...payload.extra,
        })
        if (payload.force || payload.append) return true
        if (
          featureState.queryKey === queryKey &&
          isFresh(featureState.lastFetchedAt, cacheTtlMs)
        ) {
          return false
        }
        return true
      }),
    )

    const replace$ = prepared$.pipe(
      filter(([action]) => !Boolean((action as ReturnType<typeof actions.loadListRequested>).payload.append)),
      debounce(([action]) =>
        (action as ReturnType<typeof actions.loadListRequested>).payload.force ? timer(0) : timer(400),
      ),
      distinctUntilChanged(([a], [b]) =>
        isCollapsedReplaceRequest(
          (a as ReturnType<typeof actions.loadListRequested>).payload,
          (b as ReturnType<typeof actions.loadListRequested>).payload,
        ),
      ),
      switchMap(([action, state]) =>
        toRequest(action as ReturnType<typeof actions.loadListRequested>, state),
      ),
    )

    const append$ = prepared$.pipe(
      filter(([action]) => Boolean((action as ReturnType<typeof actions.loadListRequested>).payload.append)),
      exhaustMap(([action, state]) =>
        toRequest(action as ReturnType<typeof actions.loadListRequested>, state),
      ),
    )

    return merge(replace$, append$)
  }

  const epics = combineEpics(loadListEpic)

  return {
    reducer: slice.reducer,
    actions,
    epics,
  }
}
