import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import {
  catchError,
  debounceTime,
  exhaustMap,
  filter,
  map,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'
import { emailApi, type UpdateTemplateBody } from '@/shared/services/emailApi'
import type { EmailTemplate, TemplatePreviewResult, TemplateVersion } from '@/shared/types/email.types'
import { isFresh } from '@/shared/store/cacheUtils'

interface TemplatesState {
  items: EmailTemplate[]
  lastFetchedAt: number | null
  listStatus: 'idle' | 'loading' | 'error'
  listError: string | null
  detail: EmailTemplate | null
  detailId: string | null
  detailLastFetchedAt: number | null
  detailStatus: 'idle' | 'loading' | 'saving' | 'error'
  detailError: string | null
  versions: TemplateVersion[]
  versionsTemplateId: string | null
  versionsLastFetchedAt: number | null
  versionsStatus: 'idle' | 'loading' | 'error'
  versionsError: string | null
  togglingId: string | null
  preview: TemplatePreviewResult | null
  previewStatus: 'idle' | 'loading' | 'error'
  previewError: string | null
}

const initialState: TemplatesState = {
  items: [],
  lastFetchedAt: null,
  listStatus: 'idle',
  listError: null,
  detail: null,
  detailId: null,
  detailLastFetchedAt: null,
  detailStatus: 'idle',
  detailError: null,
  versions: [],
  versionsTemplateId: null,
  versionsLastFetchedAt: null,
  versionsStatus: 'idle',
  versionsError: null,
  togglingId: null,
  preview: null,
  previewStatus: 'idle',
  previewError: null,
}

export const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    loadListRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.lastFetchedAt)) return
      state.listStatus = 'loading'
      state.listError = null
    },
    loadListSucceeded(state, action: PayloadAction<EmailTemplate[]>) {
      state.items = action.payload
      state.lastFetchedAt = Date.now()
      state.listStatus = 'idle'
    },
    loadListFailed(state, action: PayloadAction<string>) {
      state.listStatus = 'error'
      state.listError = action.payload
    },
    fetchDetailRequested(state, action: PayloadAction<{ id: string; force?: boolean }>) {
      state.detailStatus = 'loading'
      state.detailError = null
      state.detailId = action.payload.id
    },
    fetchDetailSucceeded(state, action: PayloadAction<EmailTemplate>) {
      state.detail = action.payload
      state.detailLastFetchedAt = Date.now()
      state.detailStatus = 'idle'
    },
    fetchDetailFailed(state, action: PayloadAction<string>) {
      state.detailStatus = 'error'
      state.detailError = action.payload
    },
    loadVersionsRequested(state, action: PayloadAction<{ id: string; force?: boolean }>) {
      state.versionsStatus = 'loading'
      state.versionsError = null
      state.versionsTemplateId = action.payload.id
    },
    loadVersionsSucceeded(state, action: PayloadAction<TemplateVersion[]>) {
      state.versions = action.payload
      state.versionsLastFetchedAt = Date.now()
      state.versionsStatus = 'idle'
    },
    loadVersionsFailed(state, action: PayloadAction<string>) {
      state.versionsStatus = 'error'
      state.versionsError = action.payload
    },
    updateRequested(state, _action: PayloadAction<{ id: string; body: UpdateTemplateBody }>) {
      state.detailStatus = 'saving'
      state.detailError = null
    },
    updateSucceeded(state, action: PayloadAction<EmailTemplate>) {
      state.detail = action.payload
      state.detailLastFetchedAt = Date.now()
      state.detailStatus = 'idle'
      state.lastFetchedAt = null
      state.items = state.items.map((t) => (t.id === action.payload.id ? action.payload : t))
    },
    updateFailed(state, action: PayloadAction<string>) {
      state.detailStatus = 'error'
      state.detailError = action.payload
    },
    setActiveRequested(state, action: PayloadAction<{ id: string; isActive: boolean }>) {
      state.togglingId = action.payload.id
      state.listError = null
    },
    setActiveSucceeded(state, action: PayloadAction<EmailTemplate>) {
      state.togglingId = null
      state.lastFetchedAt = null
      state.items = state.items.map((t) => (t.id === action.payload.id ? action.payload : t))
      if (state.detail?.id === action.payload.id) {
        state.detail = action.payload
      }
    },
    setActiveFailed(state, action: PayloadAction<string>) {
      state.togglingId = null
      state.listError = action.payload
    },
    restoreVersionRequested(state, _action: PayloadAction<{ id: string; versionId: string }>) {
      state.detailStatus = 'saving'
      state.detailError = null
    },
    restoreVersionSucceeded(state, action: PayloadAction<EmailTemplate>) {
      state.detail = action.payload
      state.detailLastFetchedAt = Date.now()
      state.detailStatus = 'idle'
      state.lastFetchedAt = null
      state.versionsLastFetchedAt = null
    },
    restoreVersionFailed(state, action: PayloadAction<string>) {
      state.detailStatus = 'error'
      state.detailError = action.payload
    },
    previewRequested(
      state,
      _action: PayloadAction<{ id: string; payload: Record<string, string> }>,
    ) {
      state.previewStatus = 'loading'
      state.previewError = null
    },
    previewSucceeded(state, action: PayloadAction<TemplatePreviewResult>) {
      state.preview = action.payload
      state.previewStatus = 'idle'
    },
    previewFailed(state, action: PayloadAction<string>) {
      state.previewStatus = 'error'
      state.previewError = action.payload
      state.preview = null
    },
    clearPreview(state) {
      state.preview = null
      state.previewStatus = 'idle'
      state.previewError = null
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const templatesReducer = templatesSlice.reducer
export const templatesActions = templatesSlice.actions

const loadListEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(templatesActions.loadListRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof templatesActions.loadListRequested>).payload
      const feature = (state as unknown as { templates: TemplatesState }).templates
      if (payload?.force) return true
      return !isFresh(feature.lastFetchedAt)
    }),
    exhaustMap(() =>
      from(emailApi.listTemplates()).pipe(
        map((items) => templatesActions.loadListSucceeded(items)),
        catchError((err: Error) => of(templatesActions.loadListFailed(err.message))),
      ),
    ),
  )

const fetchDetailEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(templatesActions.fetchDetailRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof templatesActions.fetchDetailRequested>).payload
      const feature = (state as unknown as { templates: TemplatesState }).templates
      if (payload.force) return true
      return !(
        feature.detailId === payload.id &&
        feature.detail &&
        isFresh(feature.detailLastFetchedAt)
      )
    }),
    debounceTime(300),
    switchMap(([action]) => {
      const { id } = (action as ReturnType<typeof templatesActions.fetchDetailRequested>).payload
      return from(emailApi.getTemplate(id)).pipe(
        map((detail) => templatesActions.fetchDetailSucceeded(detail)),
        catchError((err: Error) => of(templatesActions.fetchDetailFailed(err.message))),
      )
    }),
  )

const loadVersionsEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(templatesActions.loadVersionsRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof templatesActions.loadVersionsRequested>).payload
      const feature = (state as unknown as { templates: TemplatesState }).templates
      if (payload.force) return true
      return !(
        feature.versionsTemplateId === payload.id &&
        isFresh(feature.versionsLastFetchedAt)
      )
    }),
    debounceTime(300),
    switchMap(([action]) => {
      const { id } = (action as ReturnType<typeof templatesActions.loadVersionsRequested>).payload
      return from(emailApi.listTemplateVersions(id)).pipe(
        map((versions) => templatesActions.loadVersionsSucceeded(versions)),
        catchError((err: Error) => of(templatesActions.loadVersionsFailed(err.message))),
      )
    }),
  )

const updateEpic: Epic = (action$) =>
  action$.pipe(
    ofType(templatesActions.updateRequested.type),
    exhaustMap((action) => {
      const { id, body } = (action as ReturnType<typeof templatesActions.updateRequested>).payload
      return from(emailApi.updateTemplate(id, body)).pipe(
        map((detail) => templatesActions.updateSucceeded(detail)),
        catchError((err: Error) => of(templatesActions.updateFailed(err.message))),
      )
    }),
  )

const reloadVersionsAfterUpdateEpic: Epic = (action$) =>
  action$.pipe(
    ofType(templatesActions.updateSucceeded.type),
    map((action) => {
      const template = (action as ReturnType<typeof templatesActions.updateSucceeded>).payload
      return templatesActions.loadVersionsRequested({ id: template.id, force: true })
    }),
  )

const reloadVersionsAfterRestoreEpic: Epic = (action$) =>
  action$.pipe(
    ofType(templatesActions.restoreVersionSucceeded.type),
    map((action) => {
      const template = (action as ReturnType<typeof templatesActions.restoreVersionSucceeded>).payload
      return templatesActions.loadVersionsRequested({ id: template.id, force: true })
    }),
  )

const setActiveEpic: Epic = (action$) =>
  action$.pipe(
    ofType(templatesActions.setActiveRequested.type),
    exhaustMap((action) => {
      const { id, isActive } = (
        action as ReturnType<typeof templatesActions.setActiveRequested>
      ).payload
      return from(emailApi.setTemplateActive(id, isActive)).pipe(
        map((template) => templatesActions.setActiveSucceeded(template)),
        catchError((err: Error) => of(templatesActions.setActiveFailed(err.message))),
      )
    }),
  )

const restoreVersionEpic: Epic = (action$) =>
  action$.pipe(
    ofType(templatesActions.restoreVersionRequested.type),
    exhaustMap((action) => {
      const { id, versionId } = (
        action as ReturnType<typeof templatesActions.restoreVersionRequested>
      ).payload
      return from(emailApi.restoreTemplateVersion(id, versionId)).pipe(
        map((detail) => templatesActions.restoreVersionSucceeded(detail)),
        catchError((err: Error) => of(templatesActions.restoreVersionFailed(err.message))),
      )
    }),
  )

const previewEpic: Epic = (action$) =>
  action$.pipe(
    ofType(templatesActions.previewRequested.type),
    switchMap((action) => {
      const { id, payload } = (action as ReturnType<typeof templatesActions.previewRequested>).payload
      return from(emailApi.previewTemplate(id, payload)).pipe(
        map((result) => templatesActions.previewSucceeded(result)),
        catchError((err: Error) => of(templatesActions.previewFailed(err.message))),
      )
    }),
  )

export const templatesEpics = combineEpics(
  loadListEpic,
  fetchDetailEpic,
  loadVersionsEpic,
  updateEpic,
  reloadVersionsAfterUpdateEpic,
  reloadVersionsAfterRestoreEpic,
  setActiveEpic,
  restoreVersionEpic,
  previewEpic,
)
