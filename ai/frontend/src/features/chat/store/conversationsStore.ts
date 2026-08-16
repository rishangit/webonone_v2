import { createCatalogFeatureStore } from '@webonone/store-kit'
import { aiApi } from '@/shared/services/aiApi'
import type { Conversation } from '@/shared/types/ai.types'

export const conversationsStore = createCatalogFeatureStore<Conversation>({
  name: 'conversations',
  list: (q) => aiApi.listConversations(q),
  get: (id) => aiApi.getConversation(id),
  create: (body) => aiApi.createConversation(body),
  update: async (id) => aiApi.getConversation(id),
  delete: async () => undefined,
})

export const conversationsReducer = conversationsStore.reducer
export const conversationsActions = conversationsStore.actions
export const conversationsEpics = conversationsStore.epics
