import { apiClient } from '@/shared/services/apiClient'
import type {
  CompanyBranding,
  DashboardStats,
  EmailTemplate,
  PaginatedHistory,
  PaginatedQueue,
  ProviderInfo,
  QueueItem,
  TemplatePreviewResult,
  TemplateVersion,
} from '@/shared/types/email.types'

export type UpdateTemplateBody = {
  name?: string
  subject?: string
  htmlBody?: string
  textBody?: string
  isActive?: boolean
}

export type SendEmailBody = {
  templateSlug: string
  toEmail: string
  payload: Record<string, string>
}

export type TestEmailBody = {
  templateSlug: string
  toEmail: string
  payload?: Record<string, string>
}

export type HistoryQuery = {
  page?: number
  pageSize?: number
  status?: string
  from?: string
  to?: string
  templateSlug?: string
  search?: string
}

export type QueueQuery = {
  status?: 'pending' | 'processing' | 'failed'
  page?: number
  pageSize?: number
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const emailApi = {
  getDashboardStats() {
    return apiClient<DashboardStats>('/dashboard/stats')
  },

  listTemplates() {
    return apiClient<{ items: EmailTemplate[] }>('/templates').then((data) => data.items)
  },

  getTemplate(id: string) {
    return apiClient<EmailTemplate>(`/templates/${id}`)
  },

  updateTemplate(id: string, body: UpdateTemplateBody) {
    return apiClient<EmailTemplate>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  setTemplateActive(id: string, isActive: boolean) {
    return emailApi.updateTemplate(id, { isActive })
  },

  listTemplateVersions(id: string) {
    return apiClient<{ items: TemplateVersion[] }>(`/templates/${id}/versions`).then(
      (data) => data.items,
    )
  },

  restoreTemplateVersion(id: string, versionId: string) {
    return apiClient<EmailTemplate>(`/templates/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    })
  },

  previewTemplate(id: string, payload: Record<string, string> = {}) {
    return apiClient<TemplatePreviewResult>(`/templates/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    })
  },

  getHistory(params: HistoryQuery = {}) {
    return apiClient<PaginatedHistory>(`/history${toQueryString(params)}`)
  },

  listQueue(params: QueueQuery = {}) {
    return apiClient<PaginatedQueue>(`/queue${toQueryString(params)}`)
  },

  retryQueueItem(id: string) {
    return apiClient<QueueItem>(`/queue/${id}/retry`, {
      method: 'POST',
    })
  },

  sendEmail(body: SendEmailBody) {
    return apiClient<{ queueId: string; status: string }>('/send', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  sendTestEmail(body: TestEmailBody) {
    return apiClient<{ queueId: string; status: string }>('/send/test', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  getBranding(companyId: string) {
    return apiClient<CompanyBranding>(`/branding/${companyId}`)
  },

  updateBranding(companyId: string, body: Omit<CompanyBranding, 'companyId'>) {
    return apiClient<CompanyBranding>(`/branding/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  getProviders() {
    return apiClient<ProviderInfo & { connectionStatus: ProviderInfo['connectionStatus'] }>(
      '/providers',
    )
  },

  testProviderConnection() {
    return apiClient<{ ok: boolean; messageId?: string; message?: string }>('/providers/test', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
}

export type { EmailTemplate, CompanyBranding, ProviderInfo }
