import { apiClient } from '@/shared/services/apiClient'
import type {
  DashboardStats,
  PaginatedHistory,
  PaginatedQueue,
  QueueItem,
  SmsDevice,
  SmsTemplate,
  TemplatePreviewResult,
  TemplateVersion,
} from '@/shared/types/sms.types'
import type { GatewayConfig, GatewayMode } from '@/features/gateway/types/gateway.types'

export type CreateTemplateBody = {
  slug: string
  name: string
  body: string
  requiredKeys?: string[]
  isActive?: boolean
}

export type UpdateTemplateBody = {
  name?: string
  body?: string
  requiredKeys?: string[]
  isActive?: boolean
}

export type SendSmsBody = {
  toNumber: string
  body?: string
  templateSlug?: string
  payload?: Record<string, string>
}

export type OtpSendBody = {
  toNumber: string
  purpose?: string
}

export type HistoryQuery = {
  page?: number
  pageSize?: number
  status?: string
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

export const smsApi = {
  getDashboardStats() {
    return apiClient<DashboardStats>('/dashboard/stats')
  },

  listTemplates() {
    return apiClient<{ items: SmsTemplate[] }>('/templates').then((data) => data.items)
  },

  getTemplate(id: string) {
    return apiClient<SmsTemplate>(`/templates/${id}`)
  },

  createTemplate(body: CreateTemplateBody) {
    return apiClient<SmsTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateTemplate(id: string, body: UpdateTemplateBody) {
    return apiClient<SmsTemplate>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  deleteTemplate(id: string) {
    return apiClient<{ ok: boolean }>(`/templates/${id}`, { method: 'DELETE' })
  },

  setTemplateActive(id: string, isActive: boolean) {
    return smsApi.updateTemplate(id, { isActive })
  },

  listTemplateVersions(id: string) {
    return apiClient<{ items: TemplateVersion[] }>(`/templates/${id}/versions`).then((data) => data.items)
  },

  restoreTemplateVersion(id: string, versionId: string) {
    return apiClient<SmsTemplate>(`/templates/${id}/restore`, {
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
    return apiClient<QueueItem>(`/queue/${id}/retry`, { method: 'POST' })
  },

  sendSms(body: SendSmsBody) {
    return apiClient<{ queueId: string; status: string }>('/send', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  sendTestSms(body: SendSmsBody) {
    return apiClient<{ queueId: string; status: string }>('/send/test', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  sendOtp(body: OtpSendBody) {
    return apiClient<{ otpId: string; status: string }>('/otp/send', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  listDevices() {
    return apiClient<{ items: SmsDevice[] }>('/devices').then((data) => data.items)
  },

  approveDevice(id: string) {
    return apiClient<{ device: SmsDevice }>(`/devices/${id}/approve`, { method: 'POST' }).then(
      (data) => data.device,
    )
  },

  revokeDevice(id: string) {
    return apiClient<{ device: SmsDevice }>(`/devices/${id}/revoke`, { method: 'POST' }).then(
      (data) => data.device,
    )
  },

  getGatewayConfig() {
    return apiClient<GatewayConfig>('/gateway')
  },

  updateGatewayConfig(body: { mode: GatewayMode; senderId?: string; apiToken?: string }) {
    return apiClient<GatewayConfig>('/gateway', {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  testGateway(body: { toNumber: string }) {
    return apiClient<{ ok: boolean; providerMessageRef: string }>('/gateway/test', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}
