import { env } from '@/shared/config/env'
import { createApiClient } from './apiClient'

const client = createApiClient(env.emailApiBaseUrl)

export type EmailTemplateScope = 'platform' | 'company'

export type EmailAdminTemplate = {
  id: string
  slug: string
  name: string
  subject: string
  htmlBody: string
  textBody: string
  scope: EmailTemplateScope
  companyId: string | null
  isActive: boolean
  requiredKeys: string[]
  createdAt?: string
  updatedAt: string
  isDefault?: boolean
}

export type EmailTemplateVersion = {
  id: string
  versionNumber: number
  subject: string
  createdAt: string
  createdBy?: string | null
}

export type CreateTemplateBody = {
  slug: string
  name: string
  subject: string
  htmlBody: string
  textBody: string
}

export type UpdateTemplateBody = {
  name?: string
  subject?: string
  htmlBody?: string
  textBody?: string
  isActive?: boolean
}

export type EmailAdminQueueItem = {
  id: string
  toEmail: string
  templateSlug: string
  status: 'pending' | 'processing' | 'failed'
  retryCount: number
  lastError: string | null
  createdAt: string
}

export type EmailAdminHistoryItem = {
  id: string
  recipient: string
  templateSlug: string
  status: 'sent' | 'failed'
  sentAt: string
  errorMessage: string | null
}

export type EmailTemplatePreview = {
  subject: string
  html: string
  text: string
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

export const emailAdminApi = {
  listTemplates() {
    return client<{ items: EmailAdminTemplate[] }>('/templates').then((data) => data.items)
  },

  getTemplate(id: string) {
    return client<EmailAdminTemplate>(`/templates/${id}`)
  },

  createTemplate(body: CreateTemplateBody) {
    return client<EmailAdminTemplate>('/templates', {
      method: 'POST',
      body,
    })
  },

  updateTemplate(id: string, body: UpdateTemplateBody) {
    return client<EmailAdminTemplate>(`/templates/${id}`, {
      method: 'PUT',
      body,
    })
  },

  setTemplateActive(id: string, isActive: boolean) {
    return emailAdminApi.updateTemplate(id, { isActive })
  },

  listTemplateVersions(id: string) {
    return client<{ items: EmailTemplateVersion[] }>(`/templates/${id}/versions`).then(
      (data) => data.items,
    )
  },

  restoreTemplateVersion(id: string, versionId: string) {
    return client<EmailAdminTemplate>(`/templates/${id}/restore`, {
      method: 'POST',
      body: { versionId },
    })
  },

  previewTemplate(id: string, payload: Record<string, string> = {}) {
    return client<EmailTemplatePreview>(`/templates/${id}/preview`, {
      method: 'POST',
      body: { payload },
    })
  },

  sendEmail(body: { templateSlug: string; toEmail: string; payload: Record<string, string> }) {
    return client<{ queueId: string; status: string }>('/send', {
      method: 'POST',
      body,
    })
  },

  listQueue(params: { status?: string; page?: number; pageSize?: number } = {}) {
    return client<{ items: EmailAdminQueueItem[]; total: number }>(`/queue${toQueryString(params)}`)
  },

  retryQueueItem(id: string) {
    return client<EmailAdminQueueItem>(`/queue/${id}/retry`, { method: 'POST' })
  },

  getHistory(params: { page?: number; pageSize?: number; search?: string } = {}) {
    return client<{ items: EmailAdminHistoryItem[]; total: number }>(`/history${toQueryString(params)}`)
  },
}
