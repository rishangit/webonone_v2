import { createCatalogFeatureStore } from '@webonone/store-kit'
import { eventsApi } from '../services/eventsApi'
import type { CompanyEvent } from '../types/event.types'

export const eventsStore = createCatalogFeatureStore<CompanyEvent>({
  name: 'events',
  list: (q) => eventsApi.list(q),
  get: (id) => eventsApi.get(id),
  create: (body) => eventsApi.create(body as Parameters<typeof eventsApi.create>[0]),
  update: (id, body) => eventsApi.update(id, body as Parameters<typeof eventsApi.update>[1]),
  delete: (id) => eventsApi.delete(id),
})

export const eventsReducer = eventsStore.reducer
export const eventsActions = eventsStore.actions
export const eventsEpics = eventsStore.epics
