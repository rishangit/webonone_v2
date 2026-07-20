import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { smsApi } from '@/shared/services/smsApi'
import type { DashboardStats } from '@/shared/types/sms.types'
import { isFresh } from '@/shared/store/cacheUtils'

interface DashboardState {
  stats: DashboardStats | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
}

const initialState: DashboardState = {
  stats: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
}

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    loadStatsRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastFetchedAt)) return
      state.status = 'loading'
      state.error = null
    },
    loadStatsSucceeded(state, action: PayloadAction<DashboardStats>) {
      state.stats = action.payload
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
    },
    loadStatsFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const dashboardReducer = dashboardSlice.reducer
export const dashboardActions = dashboardSlice.actions

const loadStatsEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(dashboardActions.loadStatsRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof dashboardActions.loadStatsRequested>).payload
      const dash = (state as unknown as { dashboard: DashboardState }).dashboard
      if (payload?.force) return true
      return !isFresh(dash.lastFetchedAt)
    }),
    exhaustMap(() =>
      from(smsApi.getDashboardStats()).pipe(
        map((stats) => dashboardActions.loadStatsSucceeded(stats)),
        catchError((err: Error) => of(dashboardActions.loadStatsFailed(err.message))),
      ),
    ),
  )

export const dashboardEpics = combineEpics(loadStatsEpic)
