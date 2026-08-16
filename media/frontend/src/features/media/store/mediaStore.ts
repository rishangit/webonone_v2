import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MediaItemDto } from '@webonone/media-embed'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { forkJoin, from, merge, of } from 'rxjs'
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  mergeMap,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'
import { authActions } from '@/features/auth/store/authSlice'
import { isFresh, serializeQuery } from '@/shared/store/cacheUtils'
import { mergeAppendedItems } from '@webonone/store-kit'
import {
  getMediaItem,
  listFolders,
  listMediaItems,
  uploadMediaBatch,
  uploadMediaFile,
  type MediaFolderDto,
} from '../services/mediaApi'

export type MediaListQuery = {
  scope: string
  folderPath?: string
  page?: number
  pageSize?: number
  mimeType?: string
  force?: boolean
  append?: boolean
}

interface MediaState {
  items: MediaItemDto[]
  folders: MediaFolderDto[]
  total: number
  page: number
  pageSize: number
  listQueryKey: string
  lastFetchedAt: number | null
  listStatus: 'idle' | 'loading' | 'error'
  listError: string | null
  detailItem: MediaItemDto | null
  detailId: string | null
  detailLastFetchedAt: number | null
  detailStatus: 'idle' | 'loading' | 'error'
  detailError: string | null
  uploadStatus: 'idle' | 'uploading' | 'error'
  uploadError: string | null
  lastUploadedItems: MediaItemDto[]
  lastUploadFailed: { fileName: string; reason: string }[]
}

const initialState: MediaState = {
  items: [],
  folders: [],
  total: 0,
  page: 1,
  pageSize: 12,
  listQueryKey: '',
  lastFetchedAt: null,
  listStatus: 'idle',
  listError: null,
  detailItem: null,
  detailId: null,
  detailLastFetchedAt: null,
  detailStatus: 'idle',
  detailError: null,
  uploadStatus: 'idle',
  uploadError: null,
  lastUploadedItems: [],
  lastUploadFailed: [],
}

function buildListQueryKey(query: {
  scope: string
  folderPath: string
  page: number
  pageSize: number
  mimeType?: string
}): string {
  return serializeQuery(query)
}

export const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    loadListRequested(state, action: PayloadAction<MediaListQuery>) {
      const folderPath = action.payload.folderPath ?? '/'
      const page = action.payload.page ?? state.page
      const pageSize = action.payload.pageSize ?? state.pageSize
      const queryKey = buildListQueryKey({
        scope: action.payload.scope,
        folderPath,
        page,
        pageSize,
        mimeType: action.payload.mimeType,
      })
      if (
        !action.payload.force &&
        !action.payload.append &&
        state.listQueryKey === queryKey &&
        isFresh(state.lastFetchedAt)
      ) {
        return
      }
      state.listStatus = 'loading'
      state.listError = null
      if (action.payload.page !== undefined && !action.payload.append) {
        state.page = action.payload.page
      }
      if (action.payload.pageSize !== undefined) state.pageSize = action.payload.pageSize
    },
    loadListSucceeded(
      state,
      action: PayloadAction<{
        queryKey: string
        items: MediaItemDto[]
        folders: MediaFolderDto[]
        total: number
        page: number
        pageSize: number
        append?: boolean
      }>,
    ) {
      state.items =
        action.payload.append && action.payload.page > 1
          ? mergeAppendedItems(state.items, action.payload.items)
          : action.payload.items
      if (!action.payload.append) {
        state.folders = action.payload.folders
      }
      state.total = action.payload.total
      state.page = action.payload.page
      state.pageSize = action.payload.pageSize
      state.listQueryKey = action.payload.queryKey
      state.lastFetchedAt = Date.now()
      state.listStatus = 'idle'
    },
    loadListFailed(state, action: PayloadAction<string>) {
      state.listStatus = 'error'
      state.listError = action.payload
    },
    fetchDetailRequested(state, action: PayloadAction<{ id: string; force?: boolean }>) {
      if (
        !action.payload.force &&
        state.detailId === action.payload.id &&
        state.detailItem &&
        isFresh(state.detailLastFetchedAt)
      ) {
        return
      }
      state.detailStatus = 'loading'
      state.detailError = null
      state.detailId = action.payload.id
    },
    fetchDetailSucceeded(state, action: PayloadAction<MediaItemDto>) {
      state.detailItem = action.payload
      state.detailLastFetchedAt = Date.now()
      state.detailStatus = 'idle'
    },
    fetchDetailFailed(state, action: PayloadAction<string>) {
      state.detailStatus = 'error'
      state.detailError = action.payload
    },
    uploadRequested(
      state,
      _action: PayloadAction<{ files: File[]; scope: string; folderPath: string }>,
    ) {
      state.uploadStatus = 'uploading'
      state.uploadError = null
      state.lastUploadedItems = []
      state.lastUploadFailed = []
    },
    uploadSucceeded(
      state,
      action: PayloadAction<{
        items: MediaItemDto[]
        failed: { fileName: string; reason: string }[]
      }>,
    ) {
      state.uploadStatus = 'idle'
      state.lastUploadedItems = action.payload.items
      state.lastUploadFailed = action.payload.failed
      state.lastFetchedAt = null
    },
    uploadFailed(state, action: PayloadAction<string>) {
      state.uploadStatus = 'error'
      state.uploadError = action.payload
    },
    resetUpload(state) {
      state.uploadStatus = 'idle'
      state.uploadError = null
      state.lastUploadedItems = []
      state.lastUploadFailed = []
    },
    resetDetail(state) {
      state.detailItem = null
      state.detailId = null
      state.detailLastFetchedAt = null
      state.detailStatus = 'idle'
      state.detailError = null
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authActions.logout, (state) => {
      Object.assign(state, initialState)
    })
  },
})

export function getMediaListQueryKey(query: MediaListQuery): string {
  return buildListQueryKey({
    scope: query.scope,
    folderPath: query.folderPath ?? '/',
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 12,
    mimeType: query.mimeType,
  })
}

export const mediaReducer = mediaSlice.reducer
export const mediaActions = mediaSlice.actions

type RootStateWithMedia = { media: MediaState }

const loadListEpic: Epic = (action$, state$) => {
  const toRequest = (
    action: ReturnType<typeof mediaActions.loadListRequested>,
    state: unknown,
  ) => {
    const payload = action.payload
    const media = (state as RootStateWithMedia).media
    const folderPath = payload.folderPath ?? '/'
    const page = payload.page ?? media.page
    const pageSize = payload.pageSize ?? media.pageSize
    const queryKey = buildListQueryKey({
      scope: payload.scope,
      folderPath,
      page,
      pageSize,
      mimeType: payload.mimeType,
    })
    return forkJoin({
      media: from(
        listMediaItems({
          scope: payload.scope,
          folderPath,
          page,
          pageSize,
          mimeType: payload.mimeType,
        }),
      ),
      folders: from(listFolders(payload.scope, folderPath)),
    }).pipe(
      map(({ media: mediaResult, folders: folderResult }) =>
        mediaActions.loadListSucceeded({
          queryKey,
          items: mediaResult.items,
          folders: folderResult.folders,
          total: mediaResult.total,
          page: mediaResult.page,
          pageSize,
          append: Boolean(payload.append && page > 1),
        }),
      ),
      catchError((err: Error) => of(mediaActions.loadListFailed(err.message))),
    )
  }

  const prepared$ = action$.pipe(
    ofType(mediaActions.loadListRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof mediaActions.loadListRequested>).payload
      const media = (state as unknown as RootStateWithMedia).media
      const query = {
        scope: payload.scope,
        folderPath: payload.folderPath ?? '/',
        page: payload.page ?? media.page,
        pageSize: payload.pageSize ?? media.pageSize,
        mimeType: payload.mimeType,
      }
      const queryKey = buildListQueryKey(query)
      if (payload.force || payload.append) return true
      if (media.listQueryKey === queryKey && isFresh(media.lastFetchedAt)) {
        return false
      }
      return true
    }),
  )

  const replace$ = prepared$.pipe(
    filter(
      ([action]) =>
        !Boolean((action as ReturnType<typeof mediaActions.loadListRequested>).payload.append),
    ),
    debounceTime(400),
    distinctUntilChanged(([a], [b]) => {
      const payloadA = (a as ReturnType<typeof mediaActions.loadListRequested>).payload
      const payloadB = (b as ReturnType<typeof mediaActions.loadListRequested>).payload
      return (
        serializeQuery({
          scope: payloadA.scope,
          folderPath: payloadA.folderPath ?? '/',
          page: payloadA.page,
          pageSize: payloadA.pageSize,
          mimeType: payloadA.mimeType,
        }) ===
        serializeQuery({
          scope: payloadB.scope,
          folderPath: payloadB.folderPath ?? '/',
          page: payloadB.page,
          pageSize: payloadB.pageSize,
          mimeType: payloadB.mimeType,
        })
      )
    }),
    switchMap(([action, state]) =>
      toRequest(action as ReturnType<typeof mediaActions.loadListRequested>, state),
    ),
  )

  const append$ = prepared$.pipe(
    filter(([action]) =>
      Boolean((action as ReturnType<typeof mediaActions.loadListRequested>).payload.append),
    ),
    exhaustMap(([action, state]) =>
      toRequest(action as ReturnType<typeof mediaActions.loadListRequested>, state),
    ),
  )

  return merge(replace$, append$)
}

const fetchDetailEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(mediaActions.fetchDetailRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof mediaActions.fetchDetailRequested>).payload
      const media = (state as unknown as RootStateWithMedia).media
      if (payload.force) return true
      return !(
        media.detailId === payload.id &&
        media.detailItem &&
        isFresh(media.detailLastFetchedAt)
      )
    }),
    debounceTime(300),
    switchMap(([action]) => {
      const { id } = (action as ReturnType<typeof mediaActions.fetchDetailRequested>).payload
      return from(getMediaItem(id)).pipe(
        map((result) => mediaActions.fetchDetailSucceeded(result.item)),
        catchError((err: Error) => of(mediaActions.fetchDetailFailed(err.message))),
      )
    }),
  )

const uploadEpic: Epic = (action$) =>
  action$.pipe(
    ofType(mediaActions.uploadRequested.type),
    exhaustMap((action) => {
      const { files, scope, folderPath } = (
        action as ReturnType<typeof mediaActions.uploadRequested>
      ).payload
      const request =
        files.length === 1
          ? from(uploadMediaFile(files[0], scope, folderPath)).pipe(
              map((result) => ({ items: [result.item], failed: [] as { fileName: string; reason: string }[] })),
            )
          : from(uploadMediaBatch(files, scope, folderPath))

      return request.pipe(
        mergeMap((result) =>
          of(
            mediaActions.uploadSucceeded(result),
            mediaActions.loadListRequested({ scope, folderPath, force: true }),
          ),
        ),
        catchError((err: Error) => of(mediaActions.uploadFailed(err.message))),
      )
    }),
  )

export const mediaEpics = combineEpics(loadListEpic, fetchDetailEpic, uploadEpic)
