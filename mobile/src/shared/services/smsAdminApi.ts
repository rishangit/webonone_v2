import { env } from '@/shared/config/env'
import { createApiClient } from './apiClient'

const client = createApiClient(env.smsApiBaseUrl)

export type SmsTemplateScope = 'platform' | 'company'

export type SmsAdminTemplate = {
  id: string
  slug: string
  name: string
  body: string
  scope: SmsTemplateScope
  companyId: string | null
  isActive: boolean
  requiredKeys: string[]
  updatedAt: string
  isDefault?: boolean
}

export type SmsTemplateVersion = {
  id: string
  versionNumber: number
  body: string
  createdAt: string
  createdBy?: string | null
}

export type CreateSmsTemplateBody = {
  slug: string
  name: string
  body: string
}

export type UpdateSmsTemplateBody = {
  name?: string
  body?: string
  isActive?: boolean
}

export type SmsTemplatePreview = {
  body: string
  chars: number
  segments: number
  encoding: 'GSM-7' | 'UCS-2'
}

export type SmsAdminDevice = {
  id: string
  name: string
  status: 'pending' | 'approved' | 'revoked'
  scope: 'platform' | 'company'
  online: boolean
  lastSeenAt: string | null
}

export type SmsAdminQueueItem = {
  id: string
  toNumber: string
  templateSlug: string | null
  status: 'pending' | 'processing' | 'failed'
  retryCount: number
  lastError: string | null
  createdAt: string
}

export type SmsAdminHistoryItem = {
  id: string
  toNumber: string
  templateSlug: string | null
  status: 'sent' | 'failed'
  createdAt: string
  errorMessage: string | null
}

export type SmsDashboardStats = {
  pendingCount: number
  failedCount24h: number
  sentCount24h: number
  approvedDevices: number
  gatewayMode?: 'mobile_device' | 'text_lk'
  recentActivity: SmsAdminHistoryItem[]
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

export const smsAdminApi = {
  getDashboardStats() {
    return client<SmsDashboardStats>('/dashboard/stats')
  },

  listTemplates() {
    return client<{ items: SmsAdminTemplate[] }>('/templates').then((data) => data.items)
  },

  getTemplate(id: string) {
    return client<SmsAdminTemplate>(`/templates/${id}`)
  },

  createTemplate(body: CreateSmsTemplateBody) {
    return client<SmsAdminTemplate>('/templates', {
      method: 'POST',
      body,
    })
  },

  updateTemplate(id: string, body: UpdateSmsTemplateBody) {
    return client<SmsAdminTemplate>(`/templates/${id}`, {
      method: 'PUT',
      body,
    })
  },

  deleteTemplate(id: string) {
    return client<{ ok: boolean }>(`/templates/${id}`, { method: 'DELETE' })
  },

  setTemplateActive(id: string, isActive: boolean) {
    return smsAdminApi.updateTemplate(id, { isActive })
  },

  listTemplateVersions(id: string) {
    return client<{ items: SmsTemplateVersion[] }>(`/templates/${id}/versions`).then(
      (data) => data.items,
    )
  },

  restoreTemplateVersion(id: string, versionId: string) {
    return client<SmsAdminTemplate>(`/templates/${id}/restore`, {
      method: 'POST',
      body: { versionId },
    })
  },

  previewTemplate(id: string, payload: Record<string, string> = {}) {
    return client<SmsTemplatePreview>(`/templates/${id}/preview`, {
      method: 'POST',
      body: { payload },
    })
  },

  sendSms(body: { toNumber: string; body?: string; templateSlug?: string; payload?: Record<string, string> }) {
    return client<{ queueId: string; status: string }>('/send', {
      method: 'POST',
      body,
    })
  },

  listDevices() {
    return client<{ items: SmsAdminDevice[] }>('/devices').then((data) => data.items)
  },

  approveDevice(id: string) {
    return client<{ device: SmsAdminDevice }>(`/devices/${id}/approve`, { method: 'POST' }).then(
      (data) => data.device,
    )
  },

  revokeDevice(id: string) {
    return client<{ device: SmsAdminDevice }>(`/devices/${id}/revoke`, { method: 'POST' }).then(
      (data) => data.device,
    )
  },

  listQueue(params: { status?: string; page?: number; pageSize?: number } = {}) {
    return client<{ items: SmsAdminQueueItem[]; total: number }>(`/queue${toQueryString(params)}`)
  },

  retryQueueItem(id: string) {
    return client<SmsAdminQueueItem>(`/queue/${id}/retry`, { method: 'POST' })
  },

  getHistory(params: { page?: number; pageSize?: number; search?: string } = {}) {
    return client<{ items: SmsAdminHistoryItem[]; total: number }>(`/history${toQueryString(params)}`)
  },
}
