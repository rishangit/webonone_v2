import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { paymentApi } from '@/shared/services/paymentApi'
import type { InvoiceListItem } from '@/shared/types/payment.types'

export const invoicesStore = createPaginatedFeatureStore<InvoiceListItem>({
  name: 'invoices',
  list: async (query) => {
    return paymentApi.getInvoices({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      q: typeof query.extra?.q === 'string' ? query.extra.q : undefined,
      from: typeof query.extra?.from === 'string' ? query.extra.from : undefined,
      to: typeof query.extra?.to === 'string' ? query.extra.to : undefined,
    })
  },
})

export const invoicesReducer = invoicesStore.reducer
export const invoicesActions = invoicesStore.actions
export const invoicesEpics = invoicesStore.epics
