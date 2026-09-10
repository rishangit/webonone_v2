import { createCatalogFeatureStore } from '@webonone/store-kit'
import { websiteApi } from '../api'
import type { WebsiteDataset } from '../types'

export const websiteDatasetsStore = createCatalogFeatureStore<WebsiteDataset>({
  name: 'websiteDatasets',
  list: (q) => websiteApi.listDatasets(q),
  get: (id) => websiteApi.getDataset(id),
  create: (body) =>
    websiteApi.createDataset(body as Parameters<typeof websiteApi.createDataset>[0]),
  update: (id, body) =>
    websiteApi.updateDataset(id, body as Parameters<typeof websiteApi.updateDataset>[1]),
  delete: (id) => websiteApi.deleteDataset(id),
})

export const websiteDatasetsReducer = websiteDatasetsStore.reducer
export const websiteDatasetsActions = websiteDatasetsStore.actions
export const websiteDatasetsEpics = websiteDatasetsStore.epics
