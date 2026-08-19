import { createCatalogFeatureStore } from '@webonone/store-kit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, mergeMap } from 'rxjs/operators'
import { salesApi } from '../services/salesApi'
import type { Sale, SaleItemKind, SaleStatus } from '../types/sales.types'

const salesStore = createCatalogFeatureStore<Sale>({
  name: 'sales',
  list: async (query) => {
    const result = await salesApi.list({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      status: query.status as SaleStatus | 'all' | undefined,
      customerUserId: query.extra?.customerUserId,
      itemKind: query.extra?.itemKind as SaleItemKind | undefined,
      from: query.extra?.from,
      to: query.extra?.to,
    })
    return {
      ...result,
      items: result.items.map((item) => ({ ...item, lines: [] })),
    }
  },
  get: (id) => salesApi.get(id),
  create: (body) => salesApi.create(body as Parameters<typeof salesApi.create>[0]),
  update: (id, _body) => salesApi.get(id),
  delete: async (_id) => {
    /* Sales cannot be deleted; use void. */
  },
})

const voidRequested = {
  type: 'sales/voidRequested' as const,
}

type VoidRequested = { type: typeof voidRequested.type; payload: { id: string } }

function voidSaleRequested(id: string): VoidRequested {
  return { type: voidRequested.type, payload: { id } }
}

const voidEpic: Epic = (action$) =>
  action$.pipe(
    ofType(voidRequested.type),
    exhaustMap((action: VoidRequested) =>
      from(salesApi.void(action.payload.id)).pipe(
        mergeMap((sale) =>
          of(
            salesStore.actions.saveDetailSucceeded(sale),
            salesStore.actions.loadListRequested({ force: true }),
          ),
        ),
        catchError((err: Error) => of(salesStore.actions.saveDetailFailed(err.message))),
      ),
    ),
  )

export const salesReducer = salesStore.reducer
export const salesActions = {
  ...salesStore.actions,
  voidRequested: voidSaleRequested,
}
export const salesEpics = combineEpics(salesStore.epics, voidEpic)
