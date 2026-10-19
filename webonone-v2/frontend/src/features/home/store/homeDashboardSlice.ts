import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authActions } from '@/features/auth/store/authSlice'
import { isFresh } from '@/shared/store/cacheUtils'
import type { CompanyEventOccurrence } from '@/features/calendar/types/event.types'
import type { DashboardCompany } from '@/features/home/services/adminCompaniesApi'
import { DASHBOARD_UPCOMING_LIMIT } from '../utils/dashboardRange'

export type HomeDashboardLoadPayload = {
  from: string
  to: string
  sessionKey: string
  force?: boolean
}

export type HomeDashboardCompaniesLoadPayload = {
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
  companies: DashboardCompany[]
  companiesLastFetchedAt: number | null
  companiesStatus: 'idle' | 'loading' | 'error'
  companiesError: string | null
}

const initialState: HomeDashboardState = {
  items: [],
  from: null,
  to: null,
  sessionKey: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
  companies: [],
  companiesLastFetchedAt: null,
  companiesStatus: 'idle',
  companiesError: null,
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

export function shouldLoadDashboardCompanies(
  state: Pick<HomeDashboardState, 'companiesLastFetchedAt'>,
  payload: HomeDashboardCompaniesLoadPayload | undefined,
): boolean {
  if (payload?.force) return true
  return !isFresh(state.companiesLastFetchedAt)
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
    loadCompaniesRequested(
      state,
      action: PayloadAction<HomeDashboardCompaniesLoadPayload | undefined>,
    ) {
      if (!shouldLoadDashboardCompanies(state, action.payload)) return
      state.companiesStatus = 'loading'
      state.companiesError = null
    },
    loadCompaniesSucceeded(state, action: PayloadAction<DashboardCompany[]>) {
      state.companies = action.payload
      state.companiesLastFetchedAt = Date.now()
      state.companiesStatus = 'idle'
      state.companiesError = null
    },
    loadCompaniesFailed(state, action: PayloadAction<string>) {
      state.companiesStatus = 'error'
      state.companiesError = action.payload
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

export function selectPendingCompanies(companies: DashboardCompany[]): DashboardCompany[] {
  return companies
    .filter((item) => item.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
