import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, mergeMap } from 'rxjs/operators'
import { websiteApi, type WebsiteLibraryBrowseItem, type WebsiteLibraryKind } from '../api'
import {
  websiteFootersActions,
  websiteHeadersActions,
  websiteLayoutsActions,
  websitePagesActions,
  websitePresetsActions,
  websiteThemesActions,
} from './websiteStore'

const LIBRARY_KINDS: WebsiteLibraryKind[] = ['pages', 'headers', 'footers', 'layouts', 'presets', 'themes']

export function isWebsiteLibraryKind(value: string | undefined): value is WebsiteLibraryKind {
  return LIBRARY_KINDS.includes(value as WebsiteLibraryKind)
}

type CopyState = {
  status: 'idle' | 'saving' | 'succeeded' | 'error'
  error: string | null
  kind: WebsiteLibraryKind | null
}

const initialState: CopyState = { status: 'idle', error: null, kind: null }

export const websiteLibraryCopySlice = createSlice({
  name: 'websiteLibraryCopy',
  initialState,
  reducers: {
    copyRequested(state, action: PayloadAction<{ kind: WebsiteLibraryKind; libraryId: string }>) {
      state.status = 'saving'
      state.error = null
      state.kind = action.payload.kind
    },
    copySucceeded(state) {
      state.status = 'succeeded'
      state.error = null
    },
    copyFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    copyReset(state) {
      state.status = 'idle'
      state.error = null
      state.kind = null
    },
  },
})

export const websiteLibraryCopyActions = websiteLibraryCopySlice.actions
export const websiteLibraryCopyReducer = websiteLibraryCopySlice.reducer

function reloadList(kind: WebsiteLibraryKind) {
  const request = { force: true, page: 1 } as const
  switch (kind) {
    case 'pages':
      return websitePagesActions.loadListRequested(request)
    case 'headers':
      return websiteHeadersActions.loadListRequested(request)
    case 'footers':
      return websiteFootersActions.loadListRequested(request)
    case 'layouts':
      return websiteLayoutsActions.loadListRequested(request)
    case 'presets':
      return websitePresetsActions.loadListRequested(request)
    case 'themes':
      return websiteThemesActions.loadListRequested(request)
  }
}

const copyEpic: Epic = (action$) =>
  action$.pipe(
    ofType(websiteLibraryCopyActions.copyRequested.type),
    exhaustMap((action) => {
      const { kind, libraryId } = (
        action as ReturnType<typeof websiteLibraryCopyActions.copyRequested>
      ).payload
      return from(websiteApi.copyFromLibrary(kind, libraryId)).pipe(
        mergeMap(() => of(websiteLibraryCopyActions.copySucceeded(), reloadList(kind))),
        catchError((err: Error) => of(websiteLibraryCopyActions.copyFailed(err.message))),
      )
    }),
  )

export const websiteLibraryCopyEpics = copyEpic

export const websiteLibraryBrowseStore = createPaginatedFeatureStore<WebsiteLibraryBrowseItem>({
  name: 'websiteLibraryBrowse',
  list: (query) => {
    const kind = isWebsiteLibraryKind(query.extra?.kind) ? query.extra.kind : 'pages'
    return websiteApi.listLibrary(kind, {
      page: query.page,
      pageSize: query.pageSize,
      q: query.extra?.q,
    })
  },
})

export const websiteLibraryBrowseReducer = websiteLibraryBrowseStore.reducer
export const websiteLibraryBrowseActions = websiteLibraryBrowseStore.actions
export const websiteLibraryBrowseEpics = websiteLibraryBrowseStore.epics
