import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, mergeMap, withLatestFrom } from 'rxjs/operators'
import type { RootState } from '@/app/store'
import { websiteApi } from '../api'
import type { WebsiteTextLibraryItem } from '../types'

export const websiteTextLibraryStore = createPaginatedFeatureStore<WebsiteTextLibraryItem>({
  name: 'websiteTextLibrary',
  list: (query) =>
    websiteApi.listTextLibrary({
      page: query.page,
      pageSize: query.pageSize,
      q: typeof query.extra?.q === 'string' ? query.extra.q : undefined,
    }),
})

type CreateTextLibraryBody = { name: string; definition: WebsiteTextLibraryItem['definition']; publishStatus?: 'draft' | 'published' }

type CreateState = {
  status: 'idle' | 'saving' | 'succeeded' | 'error'
  error: string | null
}

const initialCreateState: CreateState = { status: 'idle', error: null }

type UpdateTextLibraryBody = { id: string; name: string; definition: WebsiteTextLibraryItem['definition']; publishStatus?: 'draft' | 'published' }

export const websiteTextLibraryUpdateSlice = createSlice({
  name: 'websiteTextLibraryUpdate',
  initialState: initialCreateState,
  reducers: {
    updateRequested(state, _action: PayloadAction<UpdateTextLibraryBody>) {
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

export const websiteTextLibraryCreateSlice = createSlice({
  name: 'websiteTextLibraryCreate',
  initialState: initialCreateState,
  reducers: {
    createRequested(state, _action: PayloadAction<CreateTextLibraryBody>) {
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

export const websiteTextLibraryDeleteSlice = createSlice({
  name: 'websiteTextLibraryDelete',
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

const createTextLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteTextLibraryCreateSlice.actions.createRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof websiteTextLibraryCreateSlice.actions.createRequested>).payload
      return from(websiteApi.createTextLibrary(body)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteTextLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteTextLibraryCreateSlice.actions.createSucceeded(),
            websiteTextLibraryActions.loadListRequested({
              force: true,
              page: 1,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteTextLibraryCreateSlice.actions.createFailed(err.message))),
      )
    }),
  )

const updateTextLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteTextLibraryUpdateSlice.actions.updateRequested.type),
    exhaustMap((action) => {
      const { id, ...body } = (action as ReturnType<typeof websiteTextLibraryUpdateSlice.actions.updateRequested>).payload
      return from(websiteApi.updateTextLibrary(id, body)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteTextLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteTextLibraryUpdateSlice.actions.updateSucceeded(),
            websiteTextLibraryActions.loadListRequested({
              force: true,
              page: feature.page,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteTextLibraryUpdateSlice.actions.updateFailed(err.message))),
      )
    }),
  )

const deleteTextLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteTextLibraryDeleteSlice.actions.deleteRequested.type),
    exhaustMap((action) => {
      const id = (action as ReturnType<typeof websiteTextLibraryDeleteSlice.actions.deleteRequested>).payload
      return from(websiteApi.deleteTextLibrary(id)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteTextLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteTextLibraryDeleteSlice.actions.deleteSucceeded(),
            websiteTextLibraryActions.loadListRequested({
              force: true,
              page: feature.page,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteTextLibraryDeleteSlice.actions.deleteFailed(err.message))),
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

export const websiteTextLibraryReducer = websiteTextLibraryStore.reducer
export const websiteTextLibraryActions = websiteTextLibraryStore.actions
export const websiteTextLibraryCreateReducer = websiteTextLibraryCreateSlice.reducer
export const websiteTextLibraryCreateActions = websiteTextLibraryCreateSlice.actions
export const websiteTextLibraryUpdateReducer = websiteTextLibraryUpdateSlice.reducer
export const websiteTextLibraryUpdateActions = websiteTextLibraryUpdateSlice.actions
export const websiteTextLibraryDeleteReducer = websiteTextLibraryDeleteSlice.reducer
export const websiteTextLibraryDeleteActions = websiteTextLibraryDeleteSlice.actions
export const websiteTextLibraryEpics = combineEpics(
  websiteTextLibraryStore.epics,
  createTextLibraryEpic,
  updateTextLibraryEpic,
  deleteTextLibraryEpic,
)
