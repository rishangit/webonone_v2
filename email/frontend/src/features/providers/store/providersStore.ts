import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { emailApi } from '@/shared/services/emailApi'
import type { ProviderInfo } from '@/shared/types/email.types'
import { isFresh } from '@/shared/store/cacheUtils'

interface ProvidersState {
  provider: ProviderInfo | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
  testStatus: 'idle' | 'testing' | 'error'
  testMessage: string | null
}

const initialState: ProvidersState = {
  provider: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
  testStatus: 'idle',
  testMessage: null,
}

export const providersSlice = createSlice({
  name: 'providers',
  initialState,
  reducers: {
    loadRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastFetchedAt)) return
      state.status = 'loading'
      state.error = null
    },
    loadSucceeded(state, action: PayloadAction<ProviderInfo>) {
      state.provider = action.payload
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
    },
    loadFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    testConnectionRequested(state) {
      state.testStatus = 'testing'
      state.testMessage = null
      state.error = null
    },
    testConnectionSucceeded(state, action: PayloadAction<string>) {
      state.testStatus = 'idle'
      state.testMessage = action.payload
      state.lastFetchedAt = null
    },
    testConnectionFailed(state, action: PayloadAction<string>) {
      state.testStatus = 'error'
      state.error = action.payload
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const providersReducer = providersSlice.reducer
export const providersActions = providersSlice.actions

const loadEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(providersActions.loadRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof providersActions.loadRequested>).payload
      const feature = (state as unknown as { providers: ProvidersState }).providers
      if (payload?.force) return true
      return !isFresh(feature.lastFetchedAt)
    }),
    exhaustMap(() =>
      from(emailApi.getProviders()).pipe(
        map((provider) => providersActions.loadSucceeded(provider)),
        catchError((err: Error) => of(providersActions.loadFailed(err.message))),
      ),
    ),
  )

const testConnectionEpic: Epic = (action$) =>
  action$.pipe(
    ofType(providersActions.testConnectionRequested.type),
    exhaustMap(() =>
      from(emailApi.testProviderConnection()).pipe(
        map((result) =>
          providersActions.testConnectionSucceeded(
            result.ok ? 'Connection successful' : 'Connection failed',
          ),
        ),
        catchError((err: Error) => of(providersActions.testConnectionFailed(err.message))),
      ),
    ),
  )

const reloadAfterTestEpic: Epic = (action$) =>
  action$.pipe(
    ofType(providersActions.testConnectionSucceeded.type),
    map(() => providersActions.loadRequested({ force: true })),
  )

export const providersEpics = combineEpics(loadEpic, testConnectionEpic, reloadAfterTestEpic)
