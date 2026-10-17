import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map } from 'rxjs/operators'
import { websiteApi } from '../api'
import type { WebsiteFontLibraryItem } from '../types'

export const websiteFontLibraryStore = createPaginatedFeatureStore<WebsiteFontLibraryItem>({
  name: 'websiteFontLibrary',
  list: (query) => websiteApi.listFontLibrary(query),
})

type CreateFontLibraryBody = { name: string; googleFontUrl: string; family: string }

type CreateState = {
  status: 'idle' | 'saving' | 'succeeded' | 'error'
  error: string | null
}

const initialCreateState: CreateState = { status: 'idle', error: null }

export const websiteFontLibraryCreateSlice = createSlice({
  name: 'websiteFontLibraryCreate',
  initialState: initialCreateState,
  reducers: {
    createRequested(state, _action: PayloadAction<CreateFontLibraryBody>) {
      state.status = 'saving'
      state.error = null
    },
    createSucceeded(state) {
      state.status = 'succeeded'
      state.error = null
    },
    createFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    createReset(state) {
      state.status = 'idle'
      state.error = null
    },
  },
})

const createFontLibraryEpic: Epic = (action$) =>
  action$.pipe(
    ofType(websiteFontLibraryCreateSlice.actions.createRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof websiteFontLibraryCreateSlice.actions.createRequested>).payload
      return from(websiteApi.createFontLibrary(body)).pipe(
        map(() => websiteFontLibraryCreateSlice.actions.createSucceeded()),
        catchError((err: Error) => of(websiteFontLibraryCreateSlice.actions.createFailed(err.message))),
      )
    }),
  )

export const websiteFontLibraryReducer = websiteFontLibraryStore.reducer
export const websiteFontLibraryActions = websiteFontLibraryStore.actions
export const websiteFontLibraryCreateReducer = websiteFontLibraryCreateSlice.reducer
export const websiteFontLibraryCreateActions = websiteFontLibraryCreateSlice.actions
export const websiteFontLibraryEpics = combineEpics(websiteFontLibraryStore.epics, createFontLibraryEpic)
