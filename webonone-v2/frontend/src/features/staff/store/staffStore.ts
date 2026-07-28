import { createCatalogFeatureStore } from '@webonone/store-kit'
import { staffApi } from '../services/staffApi'
import type { CompanyStaff } from '../types/staff.types'

export const staffStore = createCatalogFeatureStore<CompanyStaff>({
  name: 'staff',
  list: (q) => staffApi.list(q),
  get: (id) => staffApi.get(id),
  create: (body) => staffApi.create(body as Parameters<typeof staffApi.create>[0]),
  update: (id, body) => staffApi.update(id, body as Parameters<typeof staffApi.update>[1]),
  delete: (id) => staffApi.delete(id),
})

export const staffReducer = staffStore.reducer
export const staffActions = staffStore.actions
export const staffEpics = staffStore.epics
