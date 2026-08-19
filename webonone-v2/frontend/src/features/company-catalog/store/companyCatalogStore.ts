import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, mergeMap, switchMap } from 'rxjs/operators'
import { companyCatalogApi } from '../services/companyCatalogApi'
import type {
  CatalogBindingMode,
  CatalogEntityKind,
  CatalogGalleryImage,
  CatalogGalleryKind,
  CatalogPayload,
  CompanyCatalogItem,
  HydratedCatalogItem,
} from '../types/companyCatalog.types'
import { hydrateLinkedCatalogItems } from '../utils/hydrateLinkedCatalog'

type Status = 'idle' | 'loading' | 'saving' | 'error'

interface CompanyCatalogState {
  kind: CatalogEntityKind | null
  items: HydratedCatalogItem[]
  detail: HydratedCatalogItem | null
  listStatus: Status
  detailStatus: Status
  mutateStatus: Status
  listError: string | null
  detailError: string | null
  mutateError: string | null
}

const initialState: CompanyCatalogState = {
  kind: null,
  items: [],
  detail: null,
  listStatus: 'idle',
  detailStatus: 'idle',
  mutateStatus: 'idle',
  listError: null,
  detailError: null,
  mutateError: null,
}

const companyCatalogSlice = createSlice({
  name: 'companyCatalog',
  initialState,
  reducers: {
    listRequested(
      state,
      action: PayloadAction<{ kind: CatalogEntityKind; q?: string; companyId?: string }>,
    ) {
      if (state.kind !== action.payload.kind) {
        state.items = []
      }
      state.kind = action.payload.kind
      state.listStatus = 'loading'
      state.listError = null
    },
    listSucceeded(state, action: PayloadAction<{ kind: CatalogEntityKind; items: HydratedCatalogItem[] }>) {
      state.kind = action.payload.kind
      state.items = action.payload.items
      state.listStatus = 'idle'
    },
    listFailed(state, action: PayloadAction<string>) {
      state.listStatus = 'error'
      state.listError = action.payload
    },
    detailRequested(
      state,
      action: PayloadAction<{ kind: CatalogEntityKind; id: string; companyId?: string }>,
    ) {
      state.kind = action.payload.kind
      state.detailStatus = 'loading'
      state.detailError = null
    },
    detailSucceeded(state, action: PayloadAction<HydratedCatalogItem>) {
      state.detail = action.payload
      state.detailStatus = 'idle'
    },
    detailFailed(state, action: PayloadAction<string>) {
      state.detailStatus = 'error'
      state.detailError = action.payload
    },
    clearDetail(state) {
      state.detail = null
      state.detailError = null
      state.detailStatus = 'idle'
    },
    fromLibraryRequested(
      state,
      _action: PayloadAction<{
        kind: CatalogEntityKind
        libraryEntityId: string
        mode: Extract<CatalogBindingMode, 'linked' | 'forked'>
        payload?: CatalogPayload
      }>,
    ) {
      state.mutateStatus = 'saving'
      state.mutateError = null
    },
    createCustomRequested(
      state,
      _action: PayloadAction<{ kind: CatalogEntityKind; payload: CatalogPayload }>,
    ) {
      state.mutateStatus = 'saving'
      state.mutateError = null
    },
    forkRequested(
      state,
      _action: PayloadAction<{
        kind: CatalogEntityKind
        id: string
        payload: CatalogPayload
        galleryImages?: CatalogGalleryImage[]
      }>,
    ) {
      state.mutateStatus = 'saving'
      state.mutateError = null
    },
    updateRequested(
      state,
      _action: PayloadAction<{ kind: CatalogEntityKind; id: string; payload: CatalogPayload }>,
    ) {
      state.mutateStatus = 'saving'
      state.mutateError = null
    },
    updateGalleryRequested(
      state,
      _action: PayloadAction<{
        kind: CatalogGalleryKind
        id: string
        galleryImages: CatalogGalleryImage[]
      }>,
    ) {
      state.mutateStatus = 'saving'
      state.mutateError = null
    },
    updatePricingRequested(
      state,
      _action: PayloadAction<{
        kind: CatalogGalleryKind
        id: string
        listPrice: number | null
      }>,
    ) {
      state.mutateStatus = 'saving'
      state.mutateError = null
    },
    deleteRequested(state, _action: PayloadAction<{ kind: CatalogEntityKind; id: string }>) {
      state.mutateStatus = 'saving'
      state.mutateError = null
    },
    mutateSucceeded(state, action: PayloadAction<CompanyCatalogItem | { id: string; deleted: true }>) {
      state.mutateStatus = 'idle'
      if ('deleted' in action.payload) {
        state.items = state.items.filter((item) => item.id !== action.payload.id)
        if (state.detail?.id === action.payload.id) {
          state.detail = null
        }
      }
    },
    mutateFailed(state, action: PayloadAction<string>) {
      state.mutateStatus = 'error'
      state.mutateError = action.payload
    },
    clearMutateError(state) {
      state.mutateError = null
      if (state.mutateStatus === 'error') state.mutateStatus = 'idle'
    },
  },
})

export const companyCatalogActions = companyCatalogSlice.actions
export const companyCatalogReducer = companyCatalogSlice.reducer

type CatalogEpic = Epic

async function hydrateOne(kind: CatalogEntityKind, item: CompanyCatalogItem): Promise<HydratedCatalogItem> {
  const [hydrated] = await hydrateLinkedCatalogItems(kind, [item])
  return hydrated
}

const listEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.listRequested.type),
    switchMap((action: ReturnType<typeof companyCatalogActions.listRequested>) => {
      const { kind, q, companyId } = action.payload
      const request = companyId
        ? companyCatalogApi.listForCompany(companyId, kind, { q })
        : companyCatalogApi.list(kind, { q })
      return from(request).pipe(
        switchMap(async (result) => {
          const items = await hydrateLinkedCatalogItems(kind, result.items)
          return companyCatalogActions.listSucceeded({ kind, items })
        }),
        catchError((err: Error) => of(companyCatalogActions.listFailed(err.message))),
      )
    }),
  )

const detailEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.detailRequested.type),
    switchMap((action: ReturnType<typeof companyCatalogActions.detailRequested>) => {
      const { kind, id, companyId } = action.payload
      const request = companyId
        ? companyCatalogApi.getForCompany(companyId, kind, id)
        : companyCatalogApi.get(kind, id)
      return from(request).pipe(
        switchMap(async (item) => companyCatalogActions.detailSucceeded(await hydrateOne(kind, item))),
        catchError((err: Error) => of(companyCatalogActions.detailFailed(err.message))),
      )
    }),
  )

const fromLibraryEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.fromLibraryRequested.type),
    exhaustMap((action: ReturnType<typeof companyCatalogActions.fromLibraryRequested>) => {
      const payload = action.payload
      return from(companyCatalogApi.fromLibrary(payload.kind, payload)).pipe(
        mergeMap((item) =>
          from(hydrateOne(payload.kind, item)).pipe(
            mergeMap((hydrated) =>
              of(
                companyCatalogActions.mutateSucceeded(item),
                companyCatalogActions.listRequested({ kind: payload.kind }),
                companyCatalogActions.detailSucceeded(hydrated),
              ),
            ),
          ),
        ),
        catchError((err: Error) => of(companyCatalogActions.mutateFailed(err.message))),
      )
    }),
  )

const createCustomEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.createCustomRequested.type),
    exhaustMap((action: ReturnType<typeof companyCatalogActions.createCustomRequested>) => {
      const { kind, payload } = action.payload
      return from(companyCatalogApi.createCustom(kind, payload)).pipe(
        mergeMap((item) =>
          of(
            companyCatalogActions.mutateSucceeded(item),
            companyCatalogActions.listRequested({ kind }),
          ),
        ),
        catchError((err: Error) => of(companyCatalogActions.mutateFailed(err.message))),
      )
    }),
  )

const forkEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.forkRequested.type),
    exhaustMap((action: ReturnType<typeof companyCatalogActions.forkRequested>) => {
      const { kind, id, payload, galleryImages } = action.payload
      return from(companyCatalogApi.fork(kind, id, payload, galleryImages)).pipe(
        mergeMap((item) =>
          from(hydrateOne(kind, item)).pipe(
            mergeMap((hydrated) =>
              of(
                companyCatalogActions.mutateSucceeded(item),
                companyCatalogActions.detailSucceeded(hydrated),
                companyCatalogActions.listRequested({ kind }),
              ),
            ),
          ),
        ),
        catchError((err: Error) => of(companyCatalogActions.mutateFailed(err.message))),
      )
    }),
  )

const updateEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.updateRequested.type),
    exhaustMap((action: ReturnType<typeof companyCatalogActions.updateRequested>) => {
      const { kind, id, payload } = action.payload
      return from(companyCatalogApi.update(kind, id, payload)).pipe(
        mergeMap((item) =>
          from(hydrateOne(kind, item)).pipe(
            mergeMap((hydrated) =>
              of(
                companyCatalogActions.mutateSucceeded(item),
                companyCatalogActions.detailSucceeded(hydrated),
                companyCatalogActions.listRequested({ kind }),
              ),
            ),
          ),
        ),
        catchError((err: Error) => of(companyCatalogActions.mutateFailed(err.message))),
      )
    }),
  )

const updateGalleryEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.updateGalleryRequested.type),
    exhaustMap((action: ReturnType<typeof companyCatalogActions.updateGalleryRequested>) => {
      const { kind, id, galleryImages } = action.payload
      return from(companyCatalogApi.updateGallery(kind, id, galleryImages)).pipe(
        mergeMap((item) =>
          from(hydrateOne(kind, item)).pipe(
            mergeMap((hydrated) =>
              of(
                companyCatalogActions.mutateSucceeded(item),
                companyCatalogActions.detailSucceeded(hydrated),
              ),
            ),
          ),
        ),
        catchError((err: Error) => of(companyCatalogActions.mutateFailed(err.message))),
      )
    }),
  )

const updatePricingEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.updatePricingRequested.type),
    exhaustMap((action: ReturnType<typeof companyCatalogActions.updatePricingRequested>) => {
      const { kind, id, listPrice } = action.payload
      return from(companyCatalogApi.updatePricing(kind, id, listPrice)).pipe(
        mergeMap((item) =>
          from(hydrateOne(kind, item)).pipe(
            mergeMap((hydrated) =>
              of(
                companyCatalogActions.mutateSucceeded(item),
                companyCatalogActions.detailSucceeded(hydrated),
                companyCatalogActions.listRequested({ kind }),
              ),
            ),
          ),
        ),
        catchError((err: Error) => of(companyCatalogActions.mutateFailed(err.message))),
      )
    }),
  )

const deleteEpic: CatalogEpic = (action$) =>
  action$.pipe(
    ofType(companyCatalogActions.deleteRequested.type),
    exhaustMap((action: ReturnType<typeof companyCatalogActions.deleteRequested>) => {
      const { kind, id } = action.payload
      return from(companyCatalogApi.remove(kind, id)).pipe(
        mergeMap(() =>
          of(
            companyCatalogActions.mutateSucceeded({ id, deleted: true }),
            companyCatalogActions.listRequested({ kind }),
          ),
        ),
        catchError((err: Error) => of(companyCatalogActions.mutateFailed(err.message))),
      )
    }),
  )

export const companyCatalogEpics = combineEpics(
  listEpic,
  detailEpic,
  fromLibraryEpic,
  createCustomEpic,
  forkEpic,
  updateEpic,
  updateGalleryEpic,
  updatePricingEpic,
  deleteEpic,
)
