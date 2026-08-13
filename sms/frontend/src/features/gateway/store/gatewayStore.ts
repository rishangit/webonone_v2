import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { smsApi } from '@/shared/services/smsApi'
import { isFresh } from '@/shared/store/cacheUtils'
import type { GatewayConfig, GatewayMode } from '../types/gateway.types'

interface GatewayState {
  config: GatewayConfig | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'saving' | 'error'
  error: string | null
  saveMessage: string | null
  testStatus: 'idle' | 'testing' | 'error'
  testMessage: string | null
}

const initialState: GatewayState = {
  config: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
  saveMessage: null,
  testStatus: 'idle',
  testMessage: null,
}

export type SaveGatewayPayload = {
  mode: GatewayMode
  senderId?: string
  apiToken?: string
}

export const gatewaySlice = createSlice({
  name: 'gateway',
  initialState,
  reducers: {
    loadRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastFetchedAt)) return
      state.status = 'loading'
      state.error = null
    },
    loadSucceeded(state, action: PayloadAction<GatewayConfig>) {
      state.config = action.payload
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
    },
    loadFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    saveRequested(state, _action: PayloadAction<SaveGatewayPayload>) {
      state.status = 'saving'
      state.error = null
      state.saveMessage = null
    },
    saveSucceeded(state, action: PayloadAction<GatewayConfig>) {
      state.config = action.payload
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
      state.saveMessage = 'saved'
    },
    saveFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    testRequested(state, _action: PayloadAction<{ toNumber: string }>) {
      state.testStatus = 'testing'
      state.testMessage = null
      state.error = null
    },
    testSucceeded(state, action: PayloadAction<string>) {
      state.testStatus = 'idle'
      state.testMessage = action.payload
    },
    testFailed(state, action: PayloadAction<string>) {
      state.testStatus = 'error'
      state.error = action.payload
    },
    clearMessages(state) {
      state.saveMessage = null
      state.testMessage = null
      state.error = null
      if (state.status === 'error') state.status = 'idle'
      if (state.testStatus === 'error') state.testStatus = 'idle'
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const gatewayReducer = gatewaySlice.reducer
export const gatewayActions = gatewaySlice.actions

const loadEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(gatewayActions.loadRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof gatewayActions.loadRequested>).payload
      const feature = (state as unknown as { gateway: GatewayState }).gateway
      if (payload?.force) return true
      return !isFresh(feature.lastFetchedAt)
    }),
    exhaustMap(() =>
      from(smsApi.getGatewayConfig()).pipe(
        map((config) => gatewayActions.loadSucceeded(config)),
        catchError((err: Error) => of(gatewayActions.loadFailed(err.message))),
      ),
    ),
  )

const saveEpic: Epic = (action$) =>
  action$.pipe(
    ofType(gatewayActions.saveRequested.type),
    exhaustMap((action) => {
      const payload = (action as ReturnType<typeof gatewayActions.saveRequested>).payload
      return from(smsApi.updateGatewayConfig(payload)).pipe(
        map((config) => gatewayActions.saveSucceeded(config)),
        catchError((err: Error) => of(gatewayActions.saveFailed(err.message))),
      )
    }),
  )

const testEpic: Epic = (action$) =>
  action$.pipe(
    ofType(gatewayActions.testRequested.type),
    exhaustMap((action) => {
      const payload = (action as ReturnType<typeof gatewayActions.testRequested>).payload
      return from(smsApi.testGateway(payload)).pipe(
        map((result) =>
          gatewayActions.testSucceeded(
            result.ok
              ? `Test SMS sent (ref: ${result.providerMessageRef})`
              : 'Test SMS failed',
          ),
        ),
        catchError((err: Error) => of(gatewayActions.testFailed(err.message))),
      )
    }),
  )

export const gatewayEpics = combineEpics(loadEpic, saveEpic, testEpic)
