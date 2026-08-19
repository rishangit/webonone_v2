import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authActions } from '@/features/auth/store/authSlice'
import { isFresh } from '@/shared/store/cacheUtils'
import type { CompanyEventOccurrence } from '@/features/calendar/types/event.types'
import { DASHBOARD_UPCOMING_LIMIT } from '../utils/dashboardRange'

export type HomeDashboardLoadPayload = {
  from: string
  to: string
  sessionKey: string
  force?: boolean
}

export interface HomeDashboardState {
  items: CompanyEventOccurrence[]
  from: string | null
  to: string | null
  sessionKey: string | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
}

const initialState: HomeDashboardState = {
  items: [],
  from: null,
  to: null,
  sessionKey: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
}

export function shouldLoadHomeDashboard(
  state: Pick<HomeDashboardState, 'lastFetchedAt' | 'from' | 'to' | 'sessionKey'>,
  payload: HomeDashboardLoadPayload,
): boolean {
  if (payload.force) return true
  if (
    state.sessionKey !== payload.sessionKey ||
    state.from !== payload.from ||
    state.to !== payload.to
  ) {
    return true
  }
  return !isFresh(state.lastFetchedAt)
}

export const homeDashboardSlice = createSlice({
  name: 'homeDashboard',
  initialState,
  reducers: {
    loadRequested(state, action: PayloadAction<HomeDashboardLoadPayload>) {
      if (!shouldLoadHomeDashboard(state, action.payload)) return
      if (state.sessionKey !== action.payload.sessionKey) {
        state.items = []
        state.lastFetchedAt = null
      }
      state.status = 'loading'
      state.error = null
    },
    loadSucceeded(
      state,
      action: PayloadAction<{
        items: CompanyEventOccurrence[]
        from: string
        to: string
        sessionKey: string
      }>,
    ) {
      state.items = action.payload.items
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

export const homeDashboardReducer = homeDashboardSlice.reducer
export const homeDashboardActions = homeDashboardSlice.actions

export function selectTodayOccurrences(
  items: CompanyEventOccurrence[],
  today: string,
): CompanyEventOccurrence[] {
  return items.filter((item) => item.occurrenceDate === today)
}

export function selectUpcomingOccurrences(
  items: CompanyEventOccurrence[],
  today: string,
): CompanyEventOccurrence[] {
  return items
    .filter((item) => item.occurrenceDate > today)
    .slice(0, DASHBOARD_UPCOMING_LIMIT)
}
