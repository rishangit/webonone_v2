import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, mergeMap, withLatestFrom } from 'rxjs/operators'
import type { RootState } from '@/app/store'
import { websiteApi } from '../api'
import type { WebsiteFontLibraryItem } from '../types'

export const websiteFontLibraryStore = createPaginatedFeatureStore<WebsiteFontLibraryItem>({
  name: 'websiteFontLibrary',
  list: (query) =>
    websiteApi.listFontLibrary({
      page: query.page,
      pageSize: query.pageSize,
      q: typeof query.extra?.q === 'string' ? query.extra.q : undefined,
    }),
})

type CreateFontLibraryBody = { name: string; googleFontUrl: string; family: string }

type CreateState = {
  status: 'idle' | 'saving' | 'succeeded' | 'error'
  error: string | null
}

const initialCreateState: CreateState = { status: 'idle', error: null }

type UpdateFontLibraryBody = { id: string; name: string; googleFontUrl: string; family: string }

export const websiteFontLibraryUpdateSlice = createSlice({
  name: 'websiteFontLibraryUpdate',
  initialState: initialCreateState,
  reducers: {
    updateRequested(state, _action: PayloadAction<UpdateFontLibraryBody>) {
      state.status = 'saving'
      state.error = null
    },
    updateSucceeded(state) {
      state.status = 'succeeded'
      state.error = null
    },
    updateFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    updateReset(state) {
      state.status = 'idle'
      state.error = null
    },
  },
})

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

type DeleteState = {
  status: 'idle' | 'deleting' | 'error'
  error: string | null
  pendingId: string | null
}

const initialDeleteState: DeleteState = { status: 'idle', error: null, pendingId: null }

export const websiteFontLibraryDeleteSlice = createSlice({
  name: 'websiteFontLibraryDelete',
  initialState: initialDeleteState,
  reducers: {
    deleteRequested(state, action: PayloadAction<string>) {
      state.status = 'deleting'
      state.error = null
      state.pendingId = action.payload
    },
    deleteSucceeded(state) {
      state.status = 'idle'
      state.error = null
      state.pendingId = null
    },
    deleteFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
      state.pendingId = null
    },
    deleteReset(state) {
      state.status = 'idle'
      state.error = null
      state.pendingId = null
    },
  },
})

const createFontLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteFontLibraryCreateSlice.actions.createRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof websiteFontLibraryCreateSlice.actions.createRequested>).payload
      return from(websiteApi.createFontLibrary(body)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteFontLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteFontLibraryCreateSlice.actions.createSucceeded(),
            websiteFontLibraryActions.loadListRequested({
              force: true,
              page: 1,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteFontLibraryCreateSlice.actions.createFailed(err.message))),
      )
    }),
  )

const updateFontLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteFontLibraryUpdateSlice.actions.updateRequested.type),
    exhaustMap((action) => {
      const { id, ...body } = (action as ReturnType<typeof websiteFontLibraryUpdateSlice.actions.updateRequested>).payload
      return from(websiteApi.updateFontLibrary(id, body)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteFontLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteFontLibraryUpdateSlice.actions.updateSucceeded(),
            websiteFontLibraryActions.loadListRequested({
              force: true,
              page: feature.page,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteFontLibraryUpdateSlice.actions.updateFailed(err.message))),
      )
    }),
  )

const deleteFontLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteFontLibraryDeleteSlice.actions.deleteRequested.type),
    exhaustMap((action) => {
      const id = (action as ReturnType<typeof websiteFontLibraryDeleteSlice.actions.deleteRequested>).payload
      return from(websiteApi.deleteFontLibrary(id)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteFontLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteFontLibraryDeleteSlice.actions.deleteSucceeded(),
            websiteFontLibraryActions.loadListRequested({
              force: true,
              page: feature.page,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteFontLibraryDeleteSlice.actions.deleteFailed(err.message))),
      )
    }),
  )

function parseQueryFromKey(queryKey: string): string | undefined {
  try {
    const parsed = JSON.parse(queryKey) as { q?: string }
    return typeof parsed.q === 'string' && parsed.q.length > 0 ? parsed.q : undefined
  } catch {
    return undefined
  }
}

export const websiteFontLibraryReducer = websiteFontLibraryStore.reducer
export const websiteFontLibraryActions = websiteFontLibraryStore.actions
export const websiteFontLibraryCreateReducer = websiteFontLibraryCreateSlice.reducer
export const websiteFontLibraryCreateActions = websiteFontLibraryCreateSlice.actions
export const websiteFontLibraryUpdateReducer = websiteFontLibraryUpdateSlice.reducer
export const websiteFontLibraryUpdateActions = websiteFontLibraryUpdateSlice.actions
export const websiteFontLibraryDeleteReducer = websiteFontLibraryDeleteSlice.reducer
export const websiteFontLibraryDeleteActions = websiteFontLibraryDeleteSlice.actions
export const websiteFontLibraryEpics = combineEpics(
  websiteFontLibraryStore.epics,
  createFontLibraryEpic,
  updateFontLibraryEpic,
  deleteFontLibraryEpic,
)
