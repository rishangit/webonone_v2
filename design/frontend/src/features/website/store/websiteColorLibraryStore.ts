import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, mergeMap, withLatestFrom } from 'rxjs/operators'
import type { RootState } from '@/app/store'
import { websiteApi } from '../api'
import type { WebsiteColorLibraryItem } from '../types'

export const websiteColorLibraryStore = createPaginatedFeatureStore<WebsiteColorLibraryItem>({
  name: 'websiteColorLibrary',
  list: (query) =>
    websiteApi.listColorLibrary({
      page: query.page,
      pageSize: query.pageSize,
      q: typeof query.extra?.q === 'string' ? query.extra.q : undefined,
    }),
})

type CreateColorLibraryBody = { name: string; palette: WebsiteColorLibraryItem['palette']; publishStatus?: 'draft' | 'published' }

type CreateState = {
  status: 'idle' | 'saving' | 'succeeded' | 'error'
  error: string | null
}

const initialCreateState: CreateState = { status: 'idle', error: null }

type UpdateColorLibraryBody = { id: string; name: string; palette: WebsiteColorLibraryItem['palette']; publishStatus?: 'draft' | 'published' }

export const websiteColorLibraryUpdateSlice = createSlice({
  name: 'websiteColorLibraryUpdate',
  initialState: initialCreateState,
  reducers: {
    updateRequested(state, _action: PayloadAction<UpdateColorLibraryBody>) {
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

export const websiteColorLibraryCreateSlice = createSlice({
  name: 'websiteColorLibraryCreate',
  initialState: initialCreateState,
  reducers: {
    createRequested(state, _action: PayloadAction<CreateColorLibraryBody>) {
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

export const websiteColorLibraryDeleteSlice = createSlice({
  name: 'websiteColorLibraryDelete',
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

const createColorLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteColorLibraryCreateSlice.actions.createRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof websiteColorLibraryCreateSlice.actions.createRequested>).payload
      return from(websiteApi.createColorLibrary(body)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteColorLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteColorLibraryCreateSlice.actions.createSucceeded(),
            websiteColorLibraryActions.loadListRequested({
              force: true,
              page: 1,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteColorLibraryCreateSlice.actions.createFailed(err.message))),
      )
    }),
  )

const updateColorLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteColorLibraryUpdateSlice.actions.updateRequested.type),
    exhaustMap((action) => {
      const { id, ...body } = (action as ReturnType<typeof websiteColorLibraryUpdateSlice.actions.updateRequested>).payload
      return from(websiteApi.updateColorLibrary(id, body)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteColorLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteColorLibraryUpdateSlice.actions.updateSucceeded(),
            websiteColorLibraryActions.loadListRequested({
              force: true,
              page: feature.page,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteColorLibraryUpdateSlice.actions.updateFailed(err.message))),
      )
    }),
  )

const deleteColorLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteColorLibraryDeleteSlice.actions.deleteRequested.type),
    exhaustMap((action) => {
      const id = (action as ReturnType<typeof websiteColorLibraryDeleteSlice.actions.deleteRequested>).payload
      return from(websiteApi.deleteColorLibrary(id)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteColorLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteColorLibraryDeleteSlice.actions.deleteSucceeded(),
            websiteColorLibraryActions.loadListRequested({
              force: true,
              page: feature.page,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteColorLibraryDeleteSlice.actions.deleteFailed(err.message))),
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

export const websiteColorLibraryReducer = websiteColorLibraryStore.reducer
export const websiteColorLibraryActions = websiteColorLibraryStore.actions
export const websiteColorLibraryCreateReducer = websiteColorLibraryCreateSlice.reducer
export const websiteColorLibraryCreateActions = websiteColorLibraryCreateSlice.actions
export const websiteColorLibraryUpdateReducer = websiteColorLibraryUpdateSlice.reducer
export const websiteColorLibraryUpdateActions = websiteColorLibraryUpdateSlice.actions
export const websiteColorLibraryDeleteReducer = websiteColorLibraryDeleteSlice.reducer
export const websiteColorLibraryDeleteActions = websiteColorLibraryDeleteSlice.actions
export const websiteColorLibraryEpics = combineEpics(
  websiteColorLibraryStore.epics,
  createColorLibraryEpic,
  updateColorLibraryEpic,
  deleteColorLibraryEpic,
)
