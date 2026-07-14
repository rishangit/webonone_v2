import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { emailApi } from '@/shared/services/emailApi'
import type { CompanyBranding } from '@/shared/types/email.types'
import { isFresh } from '@/shared/store/cacheUtils'

interface SettingsState {
  branding: CompanyBranding | null
  brandingCompanyId: string | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'saving' | 'error'
  error: string | null
}

const initialState: SettingsState = {
  branding: null,
  brandingCompanyId: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    loadBrandingRequested(state, action: PayloadAction<{ companyId: string; force?: boolean }>) {
      const { companyId, force } = action.payload
      if (
        !force &&
        state.brandingCompanyId === companyId &&
        isFresh(state.lastFetchedAt)
      ) {
        return
      }
      state.status = 'loading'
      state.error = null
      state.brandingCompanyId = companyId
    },
    loadBrandingSucceeded(state, action: PayloadAction<CompanyBranding>) {
      state.branding = action.payload
      state.brandingCompanyId = action.payload.companyId
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
    },
    loadBrandingFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    saveBrandingRequested(
      state,
      _action: PayloadAction<{
        companyId: string
        body: Omit<CompanyBranding, 'companyId'>
      }>,
    ) {
      state.status = 'saving'
      state.error = null
    },
    saveBrandingSucceeded(state, action: PayloadAction<CompanyBranding>) {
      state.branding = action.payload
      state.brandingCompanyId = action.payload.companyId
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
    },
    saveBrandingFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const settingsReducer = settingsSlice.reducer
export const settingsActions = settingsSlice.actions

const loadBrandingEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(settingsActions.loadBrandingRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof settingsActions.loadBrandingRequested>).payload
      const feature = (state as unknown as { settings: SettingsState }).settings
      if (payload.force) return true
      return !(
        feature.brandingCompanyId === payload.companyId &&
        isFresh(feature.lastFetchedAt)
      )
    }),
    exhaustMap(([action]) => {
      const { companyId } = (
        action as ReturnType<typeof settingsActions.loadBrandingRequested>
      ).payload
      return from(emailApi.getBranding(companyId)).pipe(
        map((branding) => settingsActions.loadBrandingSucceeded(branding)),
        catchError((err: Error) => of(settingsActions.loadBrandingFailed(err.message))),
      )
    }),
  )

const saveBrandingEpic: Epic = (action$) =>
  action$.pipe(
    ofType(settingsActions.saveBrandingRequested.type),
    exhaustMap((action) => {
      const { companyId, body } = (
        action as ReturnType<typeof settingsActions.saveBrandingRequested>
      ).payload
      return from(emailApi.updateBranding(companyId, body)).pipe(
        map((branding) => settingsActions.saveBrandingSucceeded(branding)),
        catchError((err: Error) => of(settingsActions.saveBrandingFailed(err.message))),
      )
    }),
  )

export const settingsEpics = combineEpics(loadBrandingEpic, saveBrandingEpic)
