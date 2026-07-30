import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { paymentApi } from '@/shared/services/paymentApi'
import type { DashboardSummary } from '@/shared/types/payment.types'
import { isFresh } from '@/shared/store/cacheUtils'

interface DashboardState {
  summary: DashboardSummary | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
}

const initialState: DashboardState = {
  summary: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
}

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    loadSummaryRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastFetchedAt)) return
      state.status = 'loading'
      state.error = null
    },
    loadSummarySucceeded(state, action: PayloadAction<DashboardSummary>) {
      state.summary = action.payload
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
    },
    loadSummaryFailed(state, action: PayloadAction<string>) {
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

const loadSummaryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(dashboardActions.loadSummaryRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof dashboardActions.loadSummaryRequested>).payload
      const dash = (state as unknown as { dashboard: DashboardState }).dashboard
      if (payload?.force) return true
      return !isFresh(dash.lastFetchedAt)
    }),
    exhaustMap(() =>
      from(paymentApi.getDashboardSummary()).pipe(
        map((summary) => dashboardActions.loadSummarySucceeded(summary)),
        catchError((err: Error) => of(dashboardActions.loadSummaryFailed(err.message))),
      ),
    ),
  )

export const dashboardEpics = combineEpics(loadSummaryEpic)
