import { createCatalogFeatureStore } from '@webonone/store-kit'
import { designApi } from '@/shared/services/designApi'
import type { FormTemplate } from '@/shared/types/design.types'

export const formsStore = createCatalogFeatureStore<FormTemplate>({
  name: 'forms',
  list: (q) => designApi.listForms(q),
  get: (id) => designApi.getForm(id),
  create: (body) => designApi.createForm(body as Parameters<typeof designApi.createForm>[0]),
  update: (id, body) => designApi.updateForm(id, body),
  delete: (id) => designApi.deleteForm(id),
})

export const formsReducer = formsStore.reducer
export const formsActions = formsStore.actions
export const formsEpics = formsStore.epics
