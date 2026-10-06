import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { smsApi } from '@/shared/services/smsApi'
import type { TextLkBalance } from '@/shared/types/sms.types'
import { isFresh } from '@/shared/store/cacheUtils'

interface SmsCreditsState {
  balance: number | null
  configured: boolean | null
  lastUpdated: string | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
}

const initialState: SmsCreditsState = {
  balance: null,
  configured: null,
  lastUpdated: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
}

export const smsCreditsSlice = createSlice({
  name: 'smsCredits',
  initialState,
  reducers: {
    loadRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastFetchedAt)) return
      state.status = 'loading'
      state.error = null
    },
    loadSucceeded(state, action: PayloadAction<TextLkBalance>) {
      state.configured = action.payload.configured
      state.balance = action.payload.balance
      state.lastUpdated = action.payload.lastUpdated
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
      state.error = null
    },
    loadFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const smsCreditsReducer = smsCreditsSlice.reducer
export const smsCreditsActions = smsCreditsSlice.actions

const loadEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(smsCreditsActions.loadRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof smsCreditsActions.loadRequested>).payload
      const slice = (state as unknown as { smsCredits: SmsCreditsState }).smsCredits
      if (payload?.force) return true
      return !isFresh(slice.lastFetchedAt)
    }),
    exhaustMap(([action]) => {
      const payload = (action as ReturnType<typeof smsCreditsActions.loadRequested>).payload
      return from(smsApi.getTextLkBalance({ force: Boolean(payload?.force) })).pipe(
        map((dto) => smsCreditsActions.loadSucceeded(dto)),
        catchError((err: Error) => of(smsCreditsActions.loadFailed(err.message))),
      )
    }),
  )

export const smsCreditsEpics = combineEpics(loadEpic)
