import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, mergeMap, withLatestFrom } from 'rxjs/operators'
import type { RootState } from '@/app/store'
import { websiteApi } from '../api'
import type { WebsiteButtonLibraryItem } from '../types'

export const websiteButtonLibraryStore = createPaginatedFeatureStore<WebsiteButtonLibraryItem>({
  name: 'websiteButtonLibrary',
  list: (query) =>
    websiteApi.listButtonLibrary({
      page: query.page,
      pageSize: query.pageSize,
      q: typeof query.extra?.q === 'string' ? query.extra.q : undefined,
    }),
})

type CreateButtonLibraryBody = { name: string; definition: WebsiteButtonLibraryItem['definition'] }

type CreateState = {
  status: 'idle' | 'saving' | 'succeeded' | 'error'
  error: string | null
}

const initialCreateState: CreateState = { status: 'idle', error: null }

type UpdateButtonLibraryBody = { id: string; name: string; definition: WebsiteButtonLibraryItem['definition'] }

export const websiteButtonLibraryUpdateSlice = createSlice({
  name: 'websiteButtonLibraryUpdate',
  initialState: initialCreateState,
  reducers: {
    updateRequested(state, _action: PayloadAction<UpdateButtonLibraryBody>) {
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

export const websiteButtonLibraryCreateSlice = createSlice({
  name: 'websiteButtonLibraryCreate',
  initialState: initialCreateState,
  reducers: {
    createRequested(state, _action: PayloadAction<CreateButtonLibraryBody>) {
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

export const websiteButtonLibraryDeleteSlice = createSlice({
  name: 'websiteButtonLibraryDelete',
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

const createButtonLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteButtonLibraryCreateSlice.actions.createRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof websiteButtonLibraryCreateSlice.actions.createRequested>).payload
      return from(websiteApi.createButtonLibrary(body)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteButtonLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteButtonLibraryCreateSlice.actions.createSucceeded(),
            websiteButtonLibraryActions.loadListRequested({
              force: true,
              page: 1,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteButtonLibraryCreateSlice.actions.createFailed(err.message))),
      )
    }),
  )

const updateButtonLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteButtonLibraryUpdateSlice.actions.updateRequested.type),
    exhaustMap((action) => {
      const { id, ...body } = (action as ReturnType<typeof websiteButtonLibraryUpdateSlice.actions.updateRequested>).payload
      return from(websiteApi.updateButtonLibrary(id, body)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteButtonLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteButtonLibraryUpdateSlice.actions.updateSucceeded(),
            websiteButtonLibraryActions.loadListRequested({
              force: true,
              page: feature.page,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteButtonLibraryUpdateSlice.actions.updateFailed(err.message))),
      )
    }),
  )

const deleteButtonLibraryEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(websiteButtonLibraryDeleteSlice.actions.deleteRequested.type),
    exhaustMap((action) => {
      const id = (action as ReturnType<typeof websiteButtonLibraryDeleteSlice.actions.deleteRequested>).payload
      return from(websiteApi.deleteButtonLibrary(id)).pipe(
        withLatestFrom(state$),
        mergeMap(([, state]) => {
          const feature = (state as unknown as RootState).websiteButtonLibrary
          const q = parseQueryFromKey(feature.queryKey)
          return of(
            websiteButtonLibraryDeleteSlice.actions.deleteSucceeded(),
            websiteButtonLibraryActions.loadListRequested({
              force: true,
              page: feature.page,
              pageSize: feature.pageSize,
              extra: { q },
            }),
          )
        }),
        catchError((err: Error) => of(websiteButtonLibraryDeleteSlice.actions.deleteFailed(err.message))),
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

export const websiteButtonLibraryReducer = websiteButtonLibraryStore.reducer
export const websiteButtonLibraryActions = websiteButtonLibraryStore.actions
export const websiteButtonLibraryCreateReducer = websiteButtonLibraryCreateSlice.reducer
export const websiteButtonLibraryCreateActions = websiteButtonLibraryCreateSlice.actions
export const websiteButtonLibraryUpdateReducer = websiteButtonLibraryUpdateSlice.reducer
export const websiteButtonLibraryUpdateActions = websiteButtonLibraryUpdateSlice.actions
export const websiteButtonLibraryDeleteReducer = websiteButtonLibraryDeleteSlice.reducer
export const websiteButtonLibraryDeleteActions = websiteButtonLibraryDeleteSlice.actions
export const websiteButtonLibraryEpics = combineEpics(
  websiteButtonLibraryStore.epics,
  createButtonLibraryEpic,
  updateButtonLibraryEpic,
  deleteButtonLibraryEpic,
)
