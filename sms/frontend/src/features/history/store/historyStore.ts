import { createPaginatedFeatureStore } from '@webonone/store-kit'
import { smsApi, type HistoryQuery } from '@/shared/services/smsApi'
import type { HistoryItem } from '@/shared/types/sms.types'

export const historyStore = createPaginatedFeatureStore<HistoryItem>({
  name: 'history',
  list: async (query) => {
    const params: HistoryQuery = {
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      search: query.extra?.search,
    }
    return smsApi.getHistory(params)
  },
})

export const historyReducer = historyStore.reducer
export const historyActions = historyStore.actions
export const historyEpics = historyStore.epics
