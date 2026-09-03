import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authActions } from '@/features/auth/store/authSlice'
import { isFresh } from '@/shared/store/cacheUtils'
import type { CompanyAnalytics, PlatformAnalytics } from '../types/analytics.types'

export type AnalyticsKind = 'company' | 'platform'

export type AnalyticsLoadPayload = {
  kind: AnalyticsKind
  from: string
  to: string
  sessionKey: string
  force?: boolean
}

export interface AnalyticsState {
  kind: AnalyticsKind | null
  company: CompanyAnalytics | null
  platform: PlatformAnalytics | null
  from: string | null
  to: string | null
  sessionKey: string | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
}

const initialState: AnalyticsState = {
  kind: null,
  company: null,
  platform: null,
  from: null,
  to: null,
  sessionKey: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
}

export function shouldLoadAnalytics(
  state: Pick<AnalyticsState, 'lastFetchedAt' | 'from' | 'to' | 'sessionKey' | 'kind'>,
  payload: AnalyticsLoadPayload,
): boolean {
  if (payload.force) return true
  if (
    state.sessionKey !== payload.sessionKey ||
    state.kind !== payload.kind ||
    state.from !== payload.from ||
    state.to !== payload.to
  ) {
    return true
  }
  return !isFresh(state.lastFetchedAt)
}

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    loadRequested(state, action: PayloadAction<AnalyticsLoadPayload>) {
      if (!shouldLoadAnalytics(state, action.payload)) return
      if (state.sessionKey !== action.payload.sessionKey) {
        state.company = null
        state.platform = null
        state.lastFetchedAt = null
      }
      state.status = 'loading'
      state.error = null
    },
    loadCompanySucceeded(
      state,
      action: PayloadAction<{
        data: CompanyAnalytics
        from: string
        to: string
        sessionKey: string
      }>,
    ) {
      state.kind = 'company'
      state.company = action.payload.data
      state.platform = null
      state.from = action.payload.from
      state.to = action.payload.to
      state.sessionKey = action.payload.sessionKey
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
      state.error = null
    },
    loadPlatformSucceeded(
      state,
      action: PayloadAction<{
        data: PlatformAnalytics
        from: string
        to: string
        sessionKey: string
      }>,
    ) {
      state.kind = 'platform'
      state.platform = action.payload.data
      state.company = null
      state.from = action.payload.from
      state.to = action.payload.to
      state.sessionKey = action.payload.sessionKey
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
      state.error = null
    },
    loadFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authActions.loginSuccess, () => initialState)
    builder.addCase(authActions.logout, () => initialState)
  },
})

export const analyticsReducer = analyticsSlice.reducer
export const analyticsActions = analyticsSlice.actions
