import { createCatalogFeatureStore } from '@/shared/store/createCatalogFeatureStore'
import { dataApi } from '@/shared/services/dataApi'
import type { Unit } from '@/shared/types/data.types'

export const unitsStore = createCatalogFeatureStore<Unit>({
  name: 'units',
  list: (q) => dataApi.listUnits(q),
  get: (id) => dataApi.getUnit(id),
  create: (body) => dataApi.createUnit(body),
  update: (id, body) => dataApi.updateUnit(id, body),
  delete: (id) => dataApi.deleteUnit(id),
})

export const unitsReducer = unitsStore.reducer
export const unitsActions = unitsStore.actions
export const unitsEpics = unitsStore.epics
