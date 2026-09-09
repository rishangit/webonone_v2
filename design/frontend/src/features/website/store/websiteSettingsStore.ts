import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { isFresh } from '@webonone/store-kit'
import { websiteApi } from '../api'
import type { WebsiteSiteSettings } from '../types'

interface WebsiteSettingsState {
  settings: WebsiteSiteSettings | null
  companyId: string | null
  lastFetchedAt: number | null
  status: 'idle' | 'loading' | 'saving' | 'error'
  error: string | null
}

const initialState: WebsiteSettingsState = {
  settings: null,
  companyId: null,
  lastFetchedAt: null,
  status: 'idle',
  error: null,
}

export const websiteSettingsSlice = createSlice({
  name: 'websiteSettings',
  initialState,
  reducers: {
    loadRequested(state, action: PayloadAction<{ companyId: string; force?: boolean }>) {
      const { companyId, force } = action.payload
      if (!force && state.companyId === companyId && isFresh(state.lastFetchedAt)) {
        return
      }
      state.status = 'loading'
      state.error = null
      state.companyId = companyId
    },
    loadSucceeded(state, action: PayloadAction<WebsiteSiteSettings>) {
      state.settings = action.payload
      state.companyId = action.payload.companyId
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
    },
    loadFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    saveRequested(
      state,
      _action: PayloadAction<{ companyId: string; homePageId: string | null }>,
    ) {
      state.status = 'saving'
      state.error = null
    },
    saveSucceeded(state, action: PayloadAction<WebsiteSiteSettings>) {
      state.settings = action.payload
      state.companyId = action.payload.companyId
      state.lastFetchedAt = Date.now()
      state.status = 'idle'
    },
    saveFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const websiteSettingsReducer = websiteSettingsSlice.reducer
export const websiteSettingsActions = websiteSettingsSlice.actions

const loadEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteSettingsActions.loadRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof websiteSettingsActions.loadRequested>).payload
      const feature = (state as unknown as { websiteSettings: WebsiteSettingsState }).websiteSettings
      if (payload.force) return true
      return !(feature.companyId === payload.companyId && isFresh(feature.lastFetchedAt))
    }),
    exhaustMap(() => {
      return from(websiteApi.getSettings()).pipe(
        map((settings) => websiteSettingsActions.loadSucceeded(settings)),
        catchError((err: Error) => of(websiteSettingsActions.loadFailed(err.message))),
      )
    }),
  )

const saveEpic: Epic = (action$) =>
  action$.pipe(
    ofType(websiteSettingsActions.saveRequested.type),
    exhaustMap((action) => {
      const { homePageId } = (action as ReturnType<typeof websiteSettingsActions.saveRequested>).payload
      return from(websiteApi.updateSettings({ homePageId })).pipe(
        map((settings) => websiteSettingsActions.saveSucceeded(settings)),
        catchError((err: Error) => of(websiteSettingsActions.saveFailed(err.message))),
      )
    }),
  )

export const websiteSettingsEpics = combineEpics(loadEpic, saveEpic)
