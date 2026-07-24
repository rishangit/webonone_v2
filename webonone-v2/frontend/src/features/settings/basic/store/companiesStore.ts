import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators'
import { authActions } from '@/features/auth/store/authSlice'
import { isFresh } from '@/shared/store/cacheUtils'
import type { RegisterCompanyFormValues } from '../schemas/companySchemas'
import {
  companyApi,
  type AdminCompany,
  type CompanyDetail,
  type CompanyStatus,
  type CompanySummary,
  type MyCompanySummary,
  type UpdateCompanyBody,
} from '../services/companyApi'

interface CompaniesState {
  myCompany: CompanySummary | null | undefined
  myCompanies: MyCompanySummary[]
  adminItems: AdminCompany[]
  detail: CompanyDetail | null
  myCompanyStatus: 'idle' | 'loading' | 'saving' | 'error'
  myCompaniesStatus: 'idle' | 'loading' | 'error'
  adminListStatus: 'idle' | 'loading' | 'saving' | 'error'
  detailStatus: 'idle' | 'loading' | 'saving' | 'error'
  myCompanyError: string | null
  myCompaniesError: string | null
  adminListError: string | null
  detailError: string | null
  myCompanyFetchedAt: number | null
  myCompaniesFetchedAt: number | null
  adminListFetchedAt: number | null
  updatingId: string | null
}

const initialState: CompaniesState = {
  myCompany: undefined,
  myCompanies: [],
  adminItems: [],
  detail: null,
  myCompanyStatus: 'idle',
  myCompaniesStatus: 'idle',
  adminListStatus: 'idle',
  detailStatus: 'idle',
  myCompanyError: null,
  myCompaniesError: null,
  adminListError: null,
  detailError: null,
  myCompanyFetchedAt: null,
  myCompaniesFetchedAt: null,
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
    loadMyCompaniesRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.myCompaniesFetchedAt)) {
        return
      }
      state.myCompaniesStatus = 'loading'
      state.myCompaniesError = null
    },
    loadMyCompaniesSucceeded(state, action: PayloadAction<MyCompanySummary[]>) {
      state.myCompanies = action.payload
      state.myCompaniesFetchedAt = Date.now()
      state.myCompaniesStatus = 'idle'
    },
    loadMyCompaniesFailed(state, action: PayloadAction<string>) {
      state.myCompaniesStatus = 'error'
      state.myCompaniesError = action.payload
    },
    registerCompanyRequested(state, _action: PayloadAction<RegisterCompanyFormValues>) {
      state.myCompanyStatus = 'saving'
      state.myCompanyError = null
    },
    registerCompanySucceeded(state, action: PayloadAction<CompanySummary>) {
      state.myCompany = action.payload
      state.myCompanyFetchedAt = Date.now()
      state.myCompanyStatus = 'idle'
      state.myCompaniesFetchedAt = null

      const summary: MyCompanySummary = {
        id: action.payload.company.id,
        name: action.payload.company.name,
        logoUrl: action.payload.company.logoUrl,
        status: action.payload.company.status,
        role: action.payload.membership.role,
        createdAt: action.payload.company.createdAt,
        approvedAt: action.payload.company.approvedAt,
      }
      const withoutDuplicate = state.myCompanies.filter((item) => item.id !== summary.id)
      state.myCompanies = [summary, ...withoutDuplicate]
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
      state.myCompanies = state.myCompanies.map((item) =>
        item.id === id ? { ...item, status, approvedAt } : item,
      )
      state.updatingId = null
    },
    updateCompanyStatusFailed(state, action: PayloadAction<string>) {
      state.adminListError = action.payload
      state.updatingId = null
    },
    loadCompanyDetailRequested(state, _action: PayloadAction<{ id: string }>) {
      state.detailStatus = 'loading'
      state.detailError = null
    },
    loadCompanyDetailSucceeded(state, action: PayloadAction<CompanyDetail>) {
      state.detail = action.payload
      state.detailStatus = 'idle'
      state.detailError = null
    },
    loadCompanyDetailFailed(state, action: PayloadAction<string>) {
      state.detail = null
      state.detailStatus = 'error'
      state.detailError = action.payload
    },
    updateCompanyDetailRequested(
      state,
      _action: PayloadAction<{ id: string; body: UpdateCompanyBody }>,
    ) {
      state.detailStatus = 'saving'
      state.detailError = null
    },
    updateCompanyDetailSucceeded(state, action: PayloadAction<CompanyDetail>) {
      state.detail = action.payload
      state.detailStatus = 'idle'
      state.detailError = null
      const { id, name, logoUrl, status, approvedAt } = action.payload
      state.myCompanies = state.myCompanies.map((item) =>
        item.id === id ? { ...item, name, logoUrl, status, approvedAt } : item,
      )
      state.adminItems = state.adminItems.map((item) =>
        item.id === id ? { ...item, name, logoUrl, status, approvedAt } : item,
      )
    },
    updateCompanyDetailFailed(state, action: PayloadAction<string>) {
      state.detailStatus = 'error'
      state.detailError = action.payload
    },
    clearCompanyDetail(state) {
      state.detail = null
      state.detailStatus = 'idle'
      state.detailError = null
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

const loadMyCompaniesEpic: CompaniesEpic = (action$, state$) =>
  action$.pipe(
    ofType(companiesActions.loadMyCompaniesRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof companiesActions.loadMyCompaniesRequested>).payload
      const companies = (
        state as unknown as { companies: { myCompaniesFetchedAt: number | null } }
      ).companies
      return Boolean(payload?.force) || !isFresh(companies.myCompaniesFetchedAt)
    }),
    // switchMap so a post-register force refresh is not dropped while an earlier list load is in flight
    switchMap(() =>
      from(companyApi.listMyCompanies()).pipe(
        map((items) => companiesActions.loadMyCompaniesSucceeded(items)),
        catchError((err: Error) => of(companiesActions.loadMyCompaniesFailed(err.message))),
      ),
    ),
  )

const registerCompanyEpic: CompaniesEpic = (action$) =>
  action$.pipe(
    ofType(companiesActions.registerCompanyRequested.type),
    exhaustMap((action: ReturnType<typeof companiesActions.registerCompanyRequested>) =>
      from(companyApi.registerCompany(action.payload)).pipe(
        mergeMap((company) =>
          of(
            companiesActions.registerCompanySucceeded(company),
            companiesActions.loadMyCompaniesRequested({ force: true }),
          ),
        ),
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

const loadCompanyDetailEpic: CompaniesEpic = (action$) =>
  action$.pipe(
    ofType(companiesActions.loadCompanyDetailRequested.type),
    exhaustMap((action: ReturnType<typeof companiesActions.loadCompanyDetailRequested>) =>
      from(companyApi.getCompany(action.payload.id)).pipe(
        map((detail) => companiesActions.loadCompanyDetailSucceeded(detail)),
        catchError((err: Error) => of(companiesActions.loadCompanyDetailFailed(err.message))),
      ),
    ),
  )

const updateCompanyDetailEpic: CompaniesEpic = (action$) =>
  action$.pipe(
    ofType(companiesActions.updateCompanyDetailRequested.type),
    exhaustMap((action: ReturnType<typeof companiesActions.updateCompanyDetailRequested>) =>
      from(companyApi.updateCompany(action.payload.id, action.payload.body)).pipe(
        map((detail) => companiesActions.updateCompanyDetailSucceeded(detail)),
        catchError((err: Error) => of(companiesActions.updateCompanyDetailFailed(err.message))),
      ),
    ),
  )

export const companiesEpics = combineEpics(
  loadMyCompanyEpic,
  loadMyCompaniesEpic,
  registerCompanyEpic,
  loadAdminCompaniesEpic,
  updateCompanyStatusEpic,
  loadCompanyDetailEpic,
  updateCompanyDetailEpic,
)
