import { apiClient, API_BASE } from '@/shared/services/apiClient'
import { websiteEntityPath } from './utils/websiteCatalogScope'
import type { PaginatedResult } from '@/shared/types/design.types'
import type {
  PublicWebsiteSite,
  WebsiteChrome,
  WebsiteDocumentV1,
  WebsiteLayout,
  WebsitePage,
  WebsitePageStatus,
  WebsitePreset,
  WebsiteDataset,
  WebsiteDatasetConfig,
  WebsiteDatasetFilters,
  WebsiteDatasetSourceType,
  WebsiteDatasetStatus,
  WebsiteSiteSettings,
  WebsiteTheme,
  WebsiteFontLibraryItem,
} from './types'

type ListQuery = { page?: number; pageSize?: number; q?: string; status?: string }

function toQueryString(query: ListQuery): string {
  const params = new URLSearchParams()
  if (query.page != null) params.set('page', String(query.page))
  if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
  if (query.q) params.set('q', query.q)
  if (query.status && query.status !== 'all') params.set('status', query.status)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
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

export type UpdateChromeBody = Partial<CreateChromeBody>

export type CreatePresetBody = {
  name: string
  document?: WebsiteDocumentV1
}

export type UpdatePresetBody = Partial<CreatePresetBody>

export type CreateDatasetBody = {
  name: string
  sourceType: WebsiteDatasetSourceType
  filters?: WebsiteDatasetFilters
  config?: WebsiteDatasetConfig
  selectedFields?: string[]
  status?: WebsiteDatasetStatus
}

export type UpdateDatasetBody = Partial<CreateDatasetBody>

export type DatasetFieldCatalog = {
  sourceTypes: WebsiteDatasetSourceType[]
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
  propertyTreesBySource?: Record<
    string,
    Array<{ path: string; label: string; children?: Array<{ path: string; label: string }> }>
  >
  propertyTreesByAnalyticsDimension?: Record<
    string,
    Array<{ path: string; label: string; children?: Array<{ path: string; label: string }> }>
  >
}

export type DatasetPreviewResult = {
  items: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  sourceType: WebsiteDatasetSourceType
  datasetId: string
  datasetName: string
}

export type CreateLayoutBody = {
  name: string
  headerId?: string | null
  footerId?: string | null
  themeId?: string | null
  isDefault?: boolean
  pageIds?: string[]
}

export type UpdateLayoutBody = Partial<CreateLayoutBody>

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

export type UpdateThemeBody = Partial<CreateThemeBody>

export type UpdateWebsiteSettingsBody = {
  homePageId: string | null
}

function websiteClient<T>(path: string, init?: RequestInit): Promise<T> {
  return apiClient<T>(websiteEntityPath(path), init)
}

export type WebsiteLibraryKind = 'pages' | 'headers' | 'footers' | 'layouts' | 'presets' | 'themes'

export type WebsiteLibraryBrowseItem = {
  id: string
  name: string
  path?: string
}

function libraryListPath(kind: WebsiteLibraryKind): string {
  return kind === 'themes' ? '/website/library/themes' : `/website/library/${kind}`
}

function libraryCopyPath(kind: WebsiteLibraryKind): string {
  return kind === 'themes' ? '/website-themes/from-library' : `/website/${kind}/from-library`
}

export const websiteApi = {
  async getSettings() {
    const data = await apiClient<{ settings: WebsiteSiteSettings }>('/website/settings')
    return data.settings
  },
  async updateSettings(body: UpdateWebsiteSettingsBody) {
    const data = await apiClient<{ settings: WebsiteSiteSettings }>('/website/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.settings
  },

  listPages(query: ListQuery = {}) {
    return websiteClient<PaginatedResult<WebsitePage>>(`/website/pages${toQueryString(query)}`)
  },
  async getPage(id: string) {
    const data = await websiteClient<{ page: WebsitePage }>(`/website/pages/${id}`)
    return data.page
  },
  async createPage(body: CreatePageBody) {
    const data = await websiteClient<{ page: WebsitePage }>('/website/pages', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.page
  },
  async updatePage(id: string, body: UpdatePageBody) {
    const data = await websiteClient<{ page: WebsitePage }>(`/website/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.page
  },
  deletePage(id: string) {
    return websiteClient<void>(`/website/pages/${id}`, { method: 'DELETE' })
  },

  listChrome(kind: 'headers' | 'footers', query: ListQuery = {}) {
    return websiteClient<PaginatedResult<WebsiteChrome>>(`/website/${kind}${toQueryString(query)}`)
  },
  async getChrome(kind: 'headers' | 'footers', id: string) {
    const data = await websiteClient<{ item: WebsiteChrome }>(`/website/${kind}/${id}`)
    return data.item
  },
  async createChrome(kind: 'headers' | 'footers', body: CreateChromeBody) {
    const data = await websiteClient<{ item: WebsiteChrome }>(`/website/${kind}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.item
  },
  async updateChrome(kind: 'headers' | 'footers', id: string, body: UpdateChromeBody) {
    const data = await websiteClient<{ item: WebsiteChrome }>(`/website/${kind}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.item
  },
  deleteChrome(kind: 'headers' | 'footers', id: string) {
    return websiteClient<void>(`/website/${kind}/${id}`, { method: 'DELETE' })
  },

  listPresets(query: ListQuery = {}) {
    return websiteClient<PaginatedResult<WebsitePreset>>(`/website/presets${toQueryString(query)}`)
  },
  async getPreset(id: string) {
    const data = await websiteClient<{ item: WebsitePreset }>(`/website/presets/${id}`)
    return data.item
  },
  async createPreset(body: CreatePresetBody) {
    const data = await websiteClient<{ item: WebsitePreset }>('/website/presets', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.item
  },
  async updatePreset(id: string, body: UpdatePresetBody) {
    const data = await websiteClient<{ item: WebsitePreset }>(`/website/presets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.item
  },
  deletePreset(id: string) {
    return websiteClient<void>(`/website/presets/${id}`, { method: 'DELETE' })
  },

  getDatasetFieldCatalog() {
    return apiClient<DatasetFieldCatalog>('/website/datasets/field-catalog')
  },
  listDatasets(query: ListQuery = {}) {
    return apiClient<PaginatedResult<WebsiteDataset>>(`/website/datasets${toQueryString(query)}`)
  },
  async getDataset(id: string) {
    const data = await apiClient<{ item: WebsiteDataset }>(`/website/datasets/${id}`)
    return data.item
  },
  async createDataset(body: CreateDatasetBody) {
    const data = await apiClient<{ item: WebsiteDataset }>('/website/datasets', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.item
  },
  async updateDataset(id: string, body: UpdateDatasetBody) {
    const data = await apiClient<{ item: WebsiteDataset }>(`/website/datasets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.item
  },
  deleteDataset(id: string) {
    return apiClient<void>(`/website/datasets/${id}`, { method: 'DELETE' })
  },
  previewDataset(id: string, query: { page?: number; pageSize?: number } = {}) {
    return apiClient<DatasetPreviewResult>(`/website/datasets/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify(query),
    })
  },

  listLayouts(query: ListQuery = {}) {
    return websiteClient<PaginatedResult<WebsiteLayout>>(`/website/layouts${toQueryString(query)}`)
  },
  async getLayout(id: string) {
    const data = await websiteClient<{ item: WebsiteLayout }>(`/website/layouts/${id}`)
    return data.item
  },
  async createLayout(body: CreateLayoutBody) {
    const data = await websiteClient<{ item: WebsiteLayout }>('/website/layouts', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.item
  },
  async updateLayout(id: string, body: UpdateLayoutBody) {
    const data = await websiteClient<{ item: WebsiteLayout }>(`/website/layouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.item
  },
  deleteLayout(id: string) {
    return websiteClient<void>(`/website/layouts/${id}`, { method: 'DELETE' })
  },

  listFontLibrary(query: ListQuery = {}) {
    return apiClient<PaginatedResult<WebsiteFontLibraryItem>>(`/website/font-library${toQueryString(query)}`)
  },
  async createFontLibrary(body: { name: string; googleFontUrl: string; family: string }) {
    const data = await apiClient<{ item: WebsiteFontLibraryItem }>('/website/font-library', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.item
  },

  listThemes(query: ListQuery = {}) {
    return websiteClient<PaginatedResult<WebsiteTheme>>(`/website-themes${toQueryString(query)}`)
  },
  async getTheme(id: string) {
    const data = await websiteClient<{ theme: WebsiteTheme }>(`/website-themes/${id}`)
    return data.theme
  },
  async createTheme(body: CreateThemeBody) {
    const data = await websiteClient<{ theme: WebsiteTheme }>('/website-themes', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.theme
  },
  async updateTheme(id: string, body: UpdateThemeBody) {
    const data = await websiteClient<{ theme: WebsiteTheme }>(`/website-themes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.theme
  },
  deleteTheme(id: string) {
    return websiteClient<void>(`/website-themes/${id}`, { method: 'DELETE' })
  },

  listLibrary(kind: WebsiteLibraryKind, query: ListQuery = {}) {
    return apiClient<PaginatedResult<WebsiteLibraryBrowseItem>>(
      `${libraryListPath(kind)}${toQueryString(query)}`,
    ).then((result) => ({
      ...result,
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        path: 'path' in item && typeof item.path === 'string' ? item.path : undefined,
      })),
    }))
  },

  copyFromLibrary(kind: WebsiteLibraryKind, libraryId: string) {
    return apiClient<unknown>(libraryCopyPath(kind), {
      method: 'POST',
      body: JSON.stringify({ libraryId }),
    })
  },
}

export async function fetchPublicWebsiteSite(companyId: string, path: string): Promise<PublicWebsiteSite> {
  const params = new URLSearchParams()
  if (path) params.set('path', path)
  const qs = params.toString()
  const res = await fetch(`${API_BASE}/public/sites/${encodeURIComponent(companyId)}${qs ? `?${qs}` : ''}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error((data as { message?: string }).message ?? 'Not found') as Error & { status?: number }
    error.status = res.status
    throw error
  }
  return data as PublicWebsiteSite
}

export async function fetchPublicWebsiteDatasetData(
  companyId: string,
  datasetId: string,
): Promise<DatasetPreviewResult> {
  const res = await fetch(
    `${API_BASE}/public/sites/${encodeURIComponent(companyId)}/datasets/${encodeURIComponent(datasetId)}/data`,
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error((data as { message?: string }).message ?? 'Not found') as Error & { status?: number }
    error.status = res.status
    throw error
  }
  return data as DatasetPreviewResult
}

export type WebsiteLiveUrl = {
  companyId: string
  webSlug: string
  webUrl: string
}

export function fetchWebsiteLiveUrl() {
  return apiClient<WebsiteLiveUrl>('/website/live-url')
}
