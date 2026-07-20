import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { smsApi } from '@/shared/services/smsApi'
import type { SmsDevice } from '@/shared/types/sms.types'
import { isFresh } from '@/shared/store/cacheUtils'

const POLL_CACHE_TTL_MS = 15_000

interface DevicesState {
  items: SmsDevice[]
  lastFetchedAt: number | null
  listStatus: 'idle' | 'loading' | 'error'
  listError: string | null
  busyId: string | null
  actionError: string | null
}

const initialState: DevicesState = {
  items: [],
  lastFetchedAt: null,
  listStatus: 'idle',
  listError: null,
  busyId: null,
  actionError: null,
}

export const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    loadListRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastFetchedAt, POLL_CACHE_TTL_MS)) return
      state.listStatus = 'loading'
      state.listError = null
    },
    loadListSucceeded(state, action: PayloadAction<SmsDevice[]>) {
      state.items = action.payload
      state.lastFetchedAt = Date.now()
      state.listStatus = 'idle'
    },
    loadListFailed(state, action: PayloadAction<string>) {
      state.listStatus = 'error'
      state.listError = action.payload
    },
    approveRequested(state, action: PayloadAction<{ id: string }>) {
      state.busyId = action.payload.id
      state.actionError = null
    },
    revokeRequested(state, action: PayloadAction<{ id: string }>) {
      state.busyId = action.payload.id
      state.actionError = null
    },
    actionSucceeded(state, action: PayloadAction<SmsDevice>) {
      state.busyId = null
      state.items = state.items.map((d) => (d.id === action.payload.id ? action.payload : d))
    },
    actionFailed(state, action: PayloadAction<string>) {
      state.busyId = null
      state.actionError = action.payload
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const devicesReducer = devicesSlice.reducer
export const devicesActions = devicesSlice.actions

const loadListEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(devicesActions.loadListRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof devicesActions.loadListRequested>).payload
      const feature = (state as unknown as { devices: DevicesState }).devices
      if (payload?.force) return true
      return !isFresh(feature.lastFetchedAt, POLL_CACHE_TTL_MS)
    }),
    exhaustMap(() =>
      from(smsApi.listDevices()).pipe(
        map((items) => devicesActions.loadListSucceeded(items)),
        catchError((err: Error) => of(devicesActions.loadListFailed(err.message))),
      ),
    ),
  )

const approveEpic: Epic = (action$) =>
  action$.pipe(
    ofType(devicesActions.approveRequested.type),
    exhaustMap((action) => {
      const { id } = (action as ReturnType<typeof devicesActions.approveRequested>).payload
      return from(smsApi.approveDevice(id)).pipe(
        map((device) => devicesActions.actionSucceeded(device)),
        catchError((err: Error) => of(devicesActions.actionFailed(err.message))),
      )
    }),
  )

const revokeEpic: Epic = (action$) =>
  action$.pipe(
    ofType(devicesActions.revokeRequested.type),
    exhaustMap((action) => {
      const { id } = (action as ReturnType<typeof devicesActions.revokeRequested>).payload
      return from(smsApi.revokeDevice(id)).pipe(
        map((device) => devicesActions.actionSucceeded(device)),
        catchError((err: Error) => of(devicesActions.actionFailed(err.message))),
      )
    }),
  )

export const devicesEpics = combineEpics(loadListEpic, approveEpic, revokeEpic)
