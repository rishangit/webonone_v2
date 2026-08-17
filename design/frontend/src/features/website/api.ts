import { apiClient, API_BASE } from '@/shared/services/apiClient'
import type { PaginatedResult } from '@/shared/types/design.types'
import type {
  PublicWebsiteSite,
  WebsiteChrome,
  WebsiteDocumentV1,
  WebsitePage,
  WebsitePageStatus,
  WebsiteTheme,
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
  document?: WebsiteDocumentV1
}

export type UpdatePageBody = Partial<CreatePageBody>

export type CreateChromeBody = {
  name: string
  isDefault?: boolean
  document?: WebsiteDocumentV1
}

export type UpdateChromeBody = Partial<CreateChromeBody>

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

export const websiteApi = {
  listPages(query: ListQuery = {}) {
    return apiClient<PaginatedResult<WebsitePage>>(`/website/pages${toQueryString(query)}`)
  },
  async getPage(id: string) {
    const data = await apiClient<{ page: WebsitePage }>(`/website/pages/${id}`)
    return data.page
  },
  async createPage(body: CreatePageBody) {
    const data = await apiClient<{ page: WebsitePage }>('/website/pages', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.page
  },
  async updatePage(id: string, body: UpdatePageBody) {
    const data = await apiClient<{ page: WebsitePage }>(`/website/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.page
  },
  deletePage(id: string) {
    return apiClient<void>(`/website/pages/${id}`, { method: 'DELETE' })
  },

  listChrome(kind: 'headers' | 'footers', query: ListQuery = {}) {
    return apiClient<PaginatedResult<WebsiteChrome>>(`/website/${kind}${toQueryString(query)}`)
  },
  async getChrome(kind: 'headers' | 'footers', id: string) {
    const data = await apiClient<{ item: WebsiteChrome }>(`/website/${kind}/${id}`)
    return data.item
  },
  async createChrome(kind: 'headers' | 'footers', body: CreateChromeBody) {
    const data = await apiClient<{ item: WebsiteChrome }>(`/website/${kind}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.item
  },
  async updateChrome(kind: 'headers' | 'footers', id: string, body: UpdateChromeBody) {
    const data = await apiClient<{ item: WebsiteChrome }>(`/website/${kind}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.item
  },
  deleteChrome(kind: 'headers' | 'footers', id: string) {
    return apiClient<void>(`/website/${kind}/${id}`, { method: 'DELETE' })
  },

  listThemes(query: ListQuery = {}) {
    return apiClient<PaginatedResult<WebsiteTheme>>(`/website-themes${toQueryString(query)}`)
  },
  async getTheme(id: string) {
    const data = await apiClient<{ theme: WebsiteTheme }>(`/website-themes/${id}`)
    return data.theme
  },
  async createTheme(body: CreateThemeBody) {
    const data = await apiClient<{ theme: WebsiteTheme }>('/website-themes', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.theme
  },
  async updateTheme(id: string, body: UpdateThemeBody) {
    const data = await apiClient<{ theme: WebsiteTheme }>(`/website-themes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.theme
  },
  deleteTheme(id: string) {
    return apiClient<void>(`/website-themes/${id}`, { method: 'DELETE' })
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
