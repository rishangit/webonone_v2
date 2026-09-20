import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { DesignListQuery, DesignPaginatedResult } from '@/shared/types/design.types'
import type {
  WebsiteChrome,
  WebsiteDataset,
  WebsiteDocumentV1,
  WebsiteLayout,
  WebsitePage,
  WebsitePageStatus,
  WebsitePreset,
  WebsiteSiteSettings,
  WebsiteTheme,
} from '@/features/design/website/types'
import type {
  CreateWebsiteDatasetValues,
  UpdateWebsiteDatasetValues,
} from '@/features/design/website/schemas/websiteDatasetSchemas'

const client = createApiClient(env.designApiBaseUrl)

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

function listQuery(query: DesignListQuery = {}) {
  return toQueryString({
    page: query.page,
    pageSize: query.pageSize,
    q: query.q,
    status: query.status,
  })
}

export type CreatePageBody = {
  name: string
  path?: string
  status?: WebsitePageStatus
  layoutId?: string | null
  document?: WebsiteDocumentV1
}

export type UpdatePageBody = Partial<CreatePageBody> & { sortOrder?: number }

export type CreateChromeBody = {
  name: string
  isDefault?: boolean
  document?: WebsiteDocumentV1
}

export type CreatePresetBody = {
  name: string
  document?: WebsiteDocumentV1
}

export type CreateLayoutBody = {
  name: string
  headerId?: string | null
  footerId?: string | null
  themeId?: string | null
  isDefault?: boolean
  pageIds?: string[]
}

export type CreateThemeBody = {
  name: string
  pageBackground?: string
  bodyTextColor?: string
  isActive?: boolean
  isDefault?: boolean
  fonts?: WebsiteTheme['fonts']
  colors?: WebsiteTheme['colors']
  textStyles?: WebsiteTheme['textStyles']
  buttonStyles?: WebsiteTheme['buttonStyles']
}

export type DatasetFieldCatalog = {
  sourceTypes: string[]
  operators: string[]
  fieldsBySource: Record<
    string,
    Array<{
      field: string
      label: string
      valueType: 'string' | 'number' | 'enum'
      operators: string[]
      enumValues?: string[]
    }>
  >
  analyticsDimensions: string[]
  fieldsByAnalyticsDimension: Record<
    string,
    Array<{
      field: string
      label: string
      valueType: 'string' | 'number' | 'enum'
      operators: string[]
      enumValues?: string[]
    }>
  >
}

export type DatasetPreviewResult = {
  items: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  sourceType: string
  datasetId: string
  datasetName: string
}

export type WebsiteLiveUrl = {
  companyId: string
  webSlug: string
  webUrl: string
}

export const websiteAdminApi = {
  async getLiveUrl() {
    return client<WebsiteLiveUrl>('/website/live-url')
  },

  async getSettings() {
    const data = await client<{ settings: WebsiteSiteSettings }>('/website/settings')
    return data.settings
  },

  async updateSettings(body: { homePageId: string | null }) {
    const data = await client<{ settings: WebsiteSiteSettings }>('/website/settings', {
      method: 'PATCH',
      body,
    })
    return data.settings
  },

  listPages(query: DesignListQuery = {}) {
    return client<DesignPaginatedResult<WebsitePage>>(`/website/pages${listQuery(query)}`)
  },

  async getPage(id: string) {
    const data = await client<{ page: WebsitePage }>(`/website/pages/${id}`)
    return data.page
  },

  async createPage(body: CreatePageBody) {
    const data = await client<{ page: WebsitePage }>('/website/pages', { method: 'POST', body })
    return data.page
  },

  async updatePage(id: string, body: UpdatePageBody) {
    const data = await client<{ page: WebsitePage }>(`/website/pages/${id}`, { method: 'PATCH', body })
    return data.page
  },

  deletePage(id: string) {
    return client<void>(`/website/pages/${id}`, { method: 'DELETE' })
  },

  listChrome(kind: 'headers' | 'footers', query: DesignListQuery = {}) {
    return client<DesignPaginatedResult<WebsiteChrome>>(`/website/${kind}${listQuery(query)}`)
  },

  async getChrome(kind: 'headers' | 'footers', id: string) {
    const data = await client<{ item: WebsiteChrome }>(`/website/${kind}/${id}`)
    return data.item
  },

  async createChrome(kind: 'headers' | 'footers', body: CreateChromeBody) {
    const data = await client<{ item: WebsiteChrome }>(`/website/${kind}`, { method: 'POST', body })
    return data.item
  },

  async updateChrome(kind: 'headers' | 'footers', id: string, body: Partial<CreateChromeBody>) {
    const data = await client<{ item: WebsiteChrome }>(`/website/${kind}/${id}`, {
      method: 'PATCH',
      body,
    })
    return data.item
  },

  async setDefaultChrome(kind: 'headers' | 'footers', id: string) {
    const data = await client<{ item: WebsiteChrome }>(`/website/${kind}/${id}/default`, {
      method: 'POST',
    })
    return data.item
  },

  deleteChrome(kind: 'headers' | 'footers', id: string) {
    return client<void>(`/website/${kind}/${id}`, { method: 'DELETE' })
  },

  listPresets(query: DesignListQuery = {}) {
    return client<DesignPaginatedResult<WebsitePreset>>(`/website/presets${listQuery(query)}`)
  },

  async getPreset(id: string) {
    const data = await client<{ item: WebsitePreset }>(`/website/presets/${id}`)
    return data.item
  },

  async createPreset(body: CreatePresetBody) {
    const data = await client<{ item: WebsitePreset }>('/website/presets', { method: 'POST', body })
    return data.item
  },

  async updatePreset(id: string, body: Partial<CreatePresetBody>) {
    const data = await client<{ item: WebsitePreset }>(`/website/presets/${id}`, {
      method: 'PATCH',
      body,
    })
    return data.item
  },

  deletePreset(id: string) {
    return client<void>(`/website/presets/${id}`, { method: 'DELETE' })
  },

  getDatasetFieldCatalog() {
    return client<DatasetFieldCatalog>('/website/datasets/field-catalog')
  },

  listDatasets(query: DesignListQuery = {}) {
    return client<DesignPaginatedResult<WebsiteDataset>>(`/website/datasets${listQuery(query)}`)
  },

  async getDataset(id: string) {
    const data = await client<{ item: WebsiteDataset }>(`/website/datasets/${id}`)
    return data.item
  },

  async createDataset(body: CreateWebsiteDatasetValues) {
    const data = await client<{ item: WebsiteDataset }>('/website/datasets', { method: 'POST', body })
    return data.item
  },

  async updateDataset(id: string, body: UpdateWebsiteDatasetValues) {
    const data = await client<{ item: WebsiteDataset }>(`/website/datasets/${id}`, {
      method: 'PATCH',
      body,
    })
    return data.item
  },

  deleteDataset(id: string) {
    return client<void>(`/website/datasets/${id}`, { method: 'DELETE' })
  },

  previewDataset(id: string, query: { page?: number; pageSize?: number } = {}) {
    return client<DatasetPreviewResult>(`/website/datasets/${id}/preview`, {
      method: 'POST',
      body: query,
    })
  },

  listLayouts(query: DesignListQuery = {}) {
    return client<DesignPaginatedResult<WebsiteLayout>>(`/website/layouts${listQuery(query)}`)
  },

  async getLayout(id: string) {
    const data = await client<{ item: WebsiteLayout }>(`/website/layouts/${id}`)
    return data.item
  },

  async createLayout(body: CreateLayoutBody) {
    const data = await client<{ item: WebsiteLayout }>('/website/layouts', { method: 'POST', body })
    return data.item
  },

  async updateLayout(id: string, body: Partial<CreateLayoutBody>) {
    const data = await client<{ item: WebsiteLayout }>(`/website/layouts/${id}`, {
      method: 'PATCH',
      body,
    })
    return data.item
  },

  async setDefaultLayout(id: string) {
    const data = await client<{ item: WebsiteLayout }>(`/website/layouts/${id}/default`, {
      method: 'POST',
    })
    return data.item
  },

  deleteLayout(id: string) {
    return client<void>(`/website/layouts/${id}`, { method: 'DELETE' })
  },

  listThemes(query: DesignListQuery = {}) {
    return client<DesignPaginatedResult<WebsiteTheme>>(`/website-themes${listQuery(query)}`)
  },

  async getTheme(id: string) {
    const data = await client<{ theme: WebsiteTheme }>(`/website-themes/${id}`)
    return data.theme
  },

  async createTheme(body: CreateThemeBody) {
    const data = await client<{ theme: WebsiteTheme }>('/website-themes', { method: 'POST', body })
    return data.theme
  },

  async updateTheme(id: string, body: Partial<CreateThemeBody>) {
    const data = await client<{ theme: WebsiteTheme }>(`/website-themes/${id}`, {
      method: 'PATCH',
      body,
    })
    return data.theme
  },

  async setDefaultTheme(id: string) {
    const data = await client<{ theme: WebsiteTheme }>(`/website-themes/${id}/default`, {
      method: 'POST',
    })
    return data.theme
  },

  deleteTheme(id: string) {
    return client<void>(`/website-themes/${id}`, { method: 'DELETE' })
  },
}
