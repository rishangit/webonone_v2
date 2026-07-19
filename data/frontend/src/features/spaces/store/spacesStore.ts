import { createCatalogFeatureStore } from '@webonone/store-kit'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogItem } from '@/shared/types/data.types'

export const spacesStore = createCatalogFeatureStore<CatalogItem>({
  name: 'spaces',
  list: (q) => dataApi.listSpaces(q),
  get: (id) => dataApi.getSpace(id),
  create: (body) => dataApi.createSpace(body),
  update: (id, body) => dataApi.updateSpace(id, body),
  delete: (id) => dataApi.deleteSpace(id),
})

export const spacesReducer = spacesStore.reducer
export const spacesActions = spacesStore.actions
export const spacesEpics = spacesStore.epics
