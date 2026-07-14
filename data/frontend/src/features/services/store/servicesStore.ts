import { createCatalogFeatureStore } from '@/shared/store/createCatalogFeatureStore'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogItem } from '@/shared/types/data.types'

export const servicesStore = createCatalogFeatureStore<CatalogItem>({
  name: 'services',
  list: (q) => dataApi.listServices(q),
  get: (id) => dataApi.getService(id),
  create: (body) => dataApi.createService(body),
  update: (id, body) => dataApi.updateService(id, body),
  delete: (id) => dataApi.deleteService(id),
})

export const servicesReducer = servicesStore.reducer
export const servicesActions = servicesStore.actions
export const servicesEpics = servicesStore.epics
