import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { authActions } from '@/features/auth/store/authSlice'
import { isFresh } from '@/shared/store/cacheUtils'
import type { RegisterCompanyFormValues } from '../schemas/companySchemas'
import {
  companyApi,
  type AdminCompany,
  type CompanyStatus,
  type CompanySummary,
} from '../services/companyApi'

interface CompaniesState {
  myCompany: CompanySummary | null | undefined
  adminItems: AdminCompany[]
  myCompanyStatus: 'idle' | 'loading' | 'saving' | 'error'
  adminListStatus: 'idle' | 'loading' | 'saving' | 'error'
  myCompanyError: string | null
  adminListError: string | null
  myCompanyFetchedAt: number | null
  adminListFetchedAt: number | null
  updatingId: string | null
}

const initialState: CompaniesState = {
  myCompany: undefined,
  adminItems: [],
  myCompanyStatus: 'idle',
  adminListStatus: 'idle',
  myCompanyError: null,
  adminListError: null,
  myCompanyFetchedAt: null,
  adminListFetchedAt: null,
  updatingId: null,
}

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    loadMyCompanyRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.myCompanyFetchedAt) && state.myCompany !== undefined) {
        return
      }
      state.myCompanyStatus = 'loading'
      state.myCompanyError = null
    },
    loadMyCompanySucceeded(state, action: PayloadAction<CompanySummary | null>) {
      state.myCompany = action.payload
      state.myCompanyFetchedAt = Date.now()
      state.myCompanyStatus = 'idle'
    },
    loadMyCompanyFailed(state, action: PayloadAction<string>) {
      state.myCompany = null
      state.myCompanyStatus = 'error'
      state.myCompanyError = action.payload
    },
    registerCompanyRequested(state, _action: PayloadAction<RegisterCompanyFormValues>) {
      state.myCompanyStatus = 'saving'
      state.myCompanyError = null
    },
    registerCompanySucceeded(state, action: PayloadAction<CompanySummary>) {
      state.myCompany = action.payload
      state.myCompanyFetchedAt = Date.now()
      state.myCompanyStatus = 'idle'
    },
    registerCompanyFailed(state, action: PayloadAction<string>) {
      state.myCompanyStatus = 'error'
      state.myCompanyError = action.payload
    },
    loadAdminCompaniesRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.adminListFetchedAt)) {
        return
      }
      state.adminListStatus = 'loading'
      state.adminListError = null
    },
    loadAdminCompaniesSucceeded(state, action: PayloadAction<AdminCompany[]>) {
      state.adminItems = action.payload
      state.adminListFetchedAt = Date.now()
      state.adminListStatus = 'idle'
    },
    loadAdminCompaniesFailed(state, action: PayloadAction<string>) {
      state.adminListStatus = 'error'
      state.adminListError = action.payload
    },
    updateCompanyStatusRequested(
      state,
      action: PayloadAction<{ id: string; status: CompanyStatus }>,
    ) {
      state.updatingId = action.payload.id
      state.adminListError = null
    },
    updateCompanyStatusSucceeded(
      state,
      action: PayloadAction<{ id: string; status: CompanyStatus; approvedAt: string | null }>,
    ) {
      const { id, status, approvedAt } = action.payload
      state.adminItems = state.adminItems.map((item) =>
        item.id === id ? { ...item, status, approvedAt } : item,
      )
      state.updatingId = null
    },
    updateCompanyStatusFailed(state, action: PayloadAction<string>) {
      state.adminListError = action.payload
      state.updatingId = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authActions.logout, () => initialState)
  },
})

export const companiesReducer = companiesSlice.reducer
export const companiesActions = companiesSlice.actions

type CompaniesEpic = Epic

const loadMyCompanyEpic: CompaniesEpic = (action$, state$) =>
  action$.pipe(
    ofType(companiesActions.loadMyCompanyRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof companiesActions.loadMyCompanyRequested>).payload
      const companies = (state as unknown as { companies: { myCompanyFetchedAt: number | null } }).companies
      return Boolean(payload?.force) || !isFresh(companies.myCompanyFetchedAt)
    }),
    exhaustMap(() =>
      from(companyApi.getMyCompany()).pipe(
        map((company) => companiesActions.loadMyCompanySucceeded(company)),
        catchError((err: Error) => of(companiesActions.loadMyCompanyFailed(err.message))),
      ),
    ),
  )

const registerCompanyEpic: CompaniesEpic = (action$) =>
  action$.pipe(
    ofType(companiesActions.registerCompanyRequested.type),
    exhaustMap((action: ReturnType<typeof companiesActions.registerCompanyRequested>) =>
      from(companyApi.registerCompany(action.payload)).pipe(
        map((company) => companiesActions.registerCompanySucceeded(company)),
        catchError((err: Error) => of(companiesActions.registerCompanyFailed(err.message))),
      ),
    ),
  )

const loadAdminCompaniesEpic: CompaniesEpic = (action$, state$) =>
  action$.pipe(
    ofType(companiesActions.loadAdminCompaniesRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof companiesActions.loadAdminCompaniesRequested>).payload
      const companies = (state as unknown as { companies: { adminListFetchedAt: number | null } }).companies
      return Boolean(payload?.force) || !isFresh(companies.adminListFetchedAt)
    }),
    exhaustMap(() =>
      from(companyApi.listAllCompanies()).pipe(
        map((items) => companiesActions.loadAdminCompaniesSucceeded(items)),
        catchError((err: Error) => of(companiesActions.loadAdminCompaniesFailed(err.message))),
      ),
    ),
  )

const updateCompanyStatusEpic: CompaniesEpic = (action$) =>
  action$.pipe(
    ofType(companiesActions.updateCompanyStatusRequested.type),
    exhaustMap((action: ReturnType<typeof companiesActions.updateCompanyStatusRequested>) =>
      from(companyApi.updateCompanyStatus(action.payload.id, action.payload.status)).pipe(
        map(() =>
          companiesActions.updateCompanyStatusSucceeded({
            id: action.payload.id,
            status: action.payload.status,
            approvedAt:
              action.payload.status === 'approved' ? new Date().toISOString() : null,
          }),
        ),
        catchError((err: Error) => of(companiesActions.updateCompanyStatusFailed(err.message))),
      ),
    ),
  )

export const companiesEpics = combineEpics(
  loadMyCompanyEpic,
  registerCompanyEpic,
  loadAdminCompaniesEpic,
  updateCompanyStatusEpic,
)
