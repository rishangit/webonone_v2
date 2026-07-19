import { createCatalogFeatureStore } from '@webonone/store-kit'
import { dataApi } from '@/shared/services/dataApi'
import type { Attribute } from '@/shared/types/data.types'

export const attributesStore = createCatalogFeatureStore<Attribute>({
  name: 'attributes',
  list: (q) => dataApi.listAttributes(q),
  get: (id) => dataApi.getAttribute(id),
  create: (body) => dataApi.createAttribute(body),
  update: (id, body) => dataApi.updateAttribute(id, body),
  delete: (id) => dataApi.deleteAttribute(id),
})

export const attributesReducer = attributesStore.reducer
export const attributesActions = attributesStore.actions
export const attributesEpics = attributesStore.epics
