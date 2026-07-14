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
import { emailApi } from '@/shared/services/emailApi'
import type { QueueItem, QueueStatus } from '@/shared/types/email.types'
import { isFresh, serializeQuery } from '@/shared/store/cacheUtils'

const POLL_CACHE_TTL_MS = 30_000

interface QueueState {
  items: QueueItem[]
  total: number
  page: number
  pageSize: number
  status: QueueStatus
  queryKey: string
  lastFetchedAt: number | null
  listStatus: 'idle' | 'loading' | 'error'
  listError: string | null
  retryingId: string | null
  retryError: string | null
}

const initialState: QueueState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 12,
  status: 'pending',
  queryKey: '',
  lastFetchedAt: null,
  listStatus: 'idle',
  listError: null,
  retryingId: null,
  retryError: null,
}

export const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    loadListRequested(
      state,
      action: PayloadAction<{
        page?: number
        pageSize?: number
        status?: QueueStatus
        force?: boolean
      }>,
    ) {
      const page = action.payload.page ?? state.page
      const pageSize = action.payload.pageSize ?? state.pageSize
      const status = action.payload.status ?? state.status
      const queryKey = serializeQuery({ page, pageSize, status })
      if (
        !action.payload.force &&
        state.queryKey === queryKey &&
        isFresh(state.lastFetchedAt, POLL_CACHE_TTL_MS)
      ) {
        return
      }
      state.listStatus = 'loading'
      state.listError = null
      if (action.payload.status !== undefined) state.status = action.payload.status
      if (action.payload.page !== undefined) state.page = action.payload.page
      if (action.payload.pageSize !== undefined) state.pageSize = action.payload.pageSize
    },
    loadListSucceeded(
      state,
      action: PayloadAction<{
        queryKey: string
        items: QueueItem[]
        total: number
        page: number
        pageSize: number
      }>,
    ) {
      state.items = action.payload.items
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
    retryRequested(state, action: PayloadAction<{ id: string }>) {
      state.retryingId = action.payload.id
      state.retryError = null
    },
    retrySucceeded(state) {
      state.retryingId = null
      state.lastFetchedAt = null
    },
    retryFailed(state, action: PayloadAction<string>) {
      state.retryingId = null
      state.retryError = action.payload
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const queueReducer = queueSlice.reducer
export const queueActions = queueSlice.actions

const loadListEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(queueActions.loadListRequested.type),
    debounceTime(400),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof queueActions.loadListRequested>).payload
      const feature = (state as unknown as { queue: QueueState }).queue
      const queryKey = serializeQuery({
        page: payload.page ?? feature.page,
        pageSize: payload.pageSize ?? feature.pageSize,
        status: payload.status ?? feature.status,
      })
      if (payload.force) return true
      if (feature.queryKey === queryKey && isFresh(feature.lastFetchedAt, POLL_CACHE_TTL_MS)) {
        return false
      }
      return true
    }),
    distinctUntilChanged(
      ([a], [b]) =>
        serializeQuery((a as ReturnType<typeof queueActions.loadListRequested>).payload) ===
        serializeQuery((b as ReturnType<typeof queueActions.loadListRequested>).payload),
    ),
    switchMap(([action, state]) => {
      const payload = (action as ReturnType<typeof queueActions.loadListRequested>).payload
      const feature = (state as unknown as { queue: QueueState }).queue
      const page = payload.page ?? feature.page
      const pageSize = payload.pageSize ?? feature.pageSize
      const status = payload.status ?? feature.status
      const queryKey = serializeQuery({ page, pageSize, status })
      return from(emailApi.listQueue({ status, page, pageSize })).pipe(
        map((result) =>
          queueActions.loadListSucceeded({
            queryKey,
            items: result.items,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
          }),
        ),
        catchError((err: Error) => of(queueActions.loadListFailed(err.message))),
      )
    }),
  )

const retryEpic: Epic = (action$) =>
  action$.pipe(
    ofType(queueActions.retryRequested.type),
    exhaustMap((action) => {
      const { id } = (action as ReturnType<typeof queueActions.retryRequested>).payload
      return from(emailApi.retryQueueItem(id)).pipe(
        map(() => queueActions.retrySucceeded()),
        catchError((err: Error) => of(queueActions.retryFailed(err.message))),
      )
    }),
  )

const reloadAfterRetryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(queueActions.retrySucceeded.type),
    withLatestFrom(state$),
    map(([, state]) => {
      const feature = (state as unknown as { queue: QueueState }).queue
      return queueActions.loadListRequested({
        page: feature.page,
        pageSize: feature.pageSize,
        status: feature.status,
        force: true,
      })
    }),
  )

export const queueEpics = combineEpics(loadListEpic, retryEpic, reloadAfterRetryEpic)
