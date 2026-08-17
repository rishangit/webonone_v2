import { createCatalogFeatureStore } from '@webonone/store-kit'
import { websiteApi } from '../api'
import type { WebsiteChrome, WebsitePage, WebsiteTheme } from '../types'

export const websitePagesStore = createCatalogFeatureStore<WebsitePage>({
  name: 'websitePages',
  list: (q) => websiteApi.listPages(q),
  get: (id) => websiteApi.getPage(id),
  create: (body) => websiteApi.createPage(body as Parameters<typeof websiteApi.createPage>[0]),
  update: (id, body) => websiteApi.updatePage(id, body),
  delete: (id) => websiteApi.deletePage(id),
})

export const websiteHeadersStore = createCatalogFeatureStore<WebsiteChrome>({
  name: 'websiteHeaders',
  list: (q) => websiteApi.listChrome('headers', q),
  get: (id) => websiteApi.getChrome('headers', id),
  create: (body) => websiteApi.createChrome('headers', body as Parameters<typeof websiteApi.createChrome>[1]),
  update: (id, body) => websiteApi.updateChrome('headers', id, body),
  delete: (id) => websiteApi.deleteChrome('headers', id),
})

export const websiteFootersStore = createCatalogFeatureStore<WebsiteChrome>({
  name: 'websiteFooters',
  list: (q) => websiteApi.listChrome('footers', q),
  get: (id) => websiteApi.getChrome('footers', id),
  create: (body) => websiteApi.createChrome('footers', body as Parameters<typeof websiteApi.createChrome>[1]),
  update: (id, body) => websiteApi.updateChrome('footers', id, body),
  delete: (id) => websiteApi.deleteChrome('footers', id),
})

export const websiteThemesStore = createCatalogFeatureStore<WebsiteTheme>({
  name: 'websiteThemes',
  list: (q) => websiteApi.listThemes(q),
  get: (id) => websiteApi.getTheme(id),
  create: (body) => websiteApi.createTheme(body as Parameters<typeof websiteApi.createTheme>[0]),
  update: (id, body) => websiteApi.updateTheme(id, body),
  delete: (id) => websiteApi.deleteTheme(id),
})

export const websitePagesReducer = websitePagesStore.reducer
export const websitePagesActions = websitePagesStore.actions
export const websitePagesEpics = websitePagesStore.epics

export const websiteHeadersReducer = websiteHeadersStore.reducer
export const websiteHeadersActions = websiteHeadersStore.actions
export const websiteHeadersEpics = websiteHeadersStore.epics

export const websiteFootersReducer = websiteFootersStore.reducer
export const websiteFootersActions = websiteFootersStore.actions
export const websiteFootersEpics = websiteFootersStore.epics

export const websiteThemesReducer = websiteThemesStore.reducer
export const websiteThemesActions = websiteThemesStore.actions
export const websiteThemesEpics = websiteThemesStore.epics
