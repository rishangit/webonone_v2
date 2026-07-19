import { createCatalogFeatureStore } from '@webonone/store-kit'
import { dataApi } from '@/shared/services/dataApi'
import type { Tag } from '@/shared/types/data.types'

export const tagsStore = createCatalogFeatureStore<Tag>({
  name: 'tags',
  list: (q) => dataApi.listTags(q),
  get: (id) => dataApi.getTag(id),
  create: (body) => dataApi.createTag(body as Parameters<typeof dataApi.createTag>[0]),
  update: (id, body) => dataApi.updateTag(id, body),
  delete: (id) => dataApi.deleteTag(id),
})

export const tagsReducer = tagsStore.reducer
export const tagsActions = tagsStore.actions
export const tagsEpics = tagsStore.epics
