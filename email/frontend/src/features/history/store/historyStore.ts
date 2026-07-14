import { createPaginatedFeatureStore } from '@/shared/store/createPaginatedFeatureStore'
import { emailApi, type HistoryQuery } from '@/shared/services/emailApi'
import type { HistoryItem } from '@/shared/types/email.types'

export const historyStore = createPaginatedFeatureStore<HistoryItem>({
  name: 'history',
  list: async (query) => {
    const params: HistoryQuery = {
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      from: query.extra?.from,
      to: query.extra?.to,
      search: query.extra?.search,
      templateSlug: query.extra?.templateSlug,
    }
    return emailApi.getHistory(params)
  },
})

export const historyReducer = historyStore.reducer
export const historyActions = historyStore.actions
export const historyEpics = historyStore.epics
