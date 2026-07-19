import { createCatalogFeatureStore } from '@webonone/store-kit'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogItem } from '@/shared/types/data.types'

export const productsStore = createCatalogFeatureStore<CatalogItem>({
  name: 'products',
  list: (q) => dataApi.listProducts(q),
  get: (id) => dataApi.getProduct(id),
  create: (body) => dataApi.createProduct(body),
  update: (id, body) => dataApi.updateProduct(id, body),
  delete: (id) => dataApi.deleteProduct(id),
})

export const productsReducer = productsStore.reducer
export const productsActions = productsStore.actions
export const productsEpics = productsStore.epics
