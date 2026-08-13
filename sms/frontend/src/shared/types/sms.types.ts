export type SmsTemplateScope = 'platform' | 'company'

export type MessageStatus = 'sent' | 'failed'

export type QueueStatus = 'pending' | 'processing' | 'failed'

export type DeviceScope = 'platform' | 'company'

export type DeviceStatus = 'pending' | 'approved' | 'revoked'

export interface HistoryItem {
  id: string
  toNumber: string
  templateSlug: string | null
  status: MessageStatus
  createdAt: string
  errorMessage: string | null
  deviceId?: string | null
  companyId?: string | null
}

export interface QueueItem {
  id: string
  toNumber: string
  templateSlug: string | null
  status: QueueStatus
  retryCount: number
  createdAt: string
  lastError: string | null
}

export interface SmsTemplate {
  id: string
  slug: string
  name: string
  body: string
  scope: SmsTemplateScope
  companyId: string | null
  isActive: boolean
  requiredKeys: string[]
  updatedAt: string
  /** True when this is a platform default shown until the company saves an override. */
  isDefault?: boolean
}

export interface TemplateVersion {
  id: string
  versionNumber: number
  body: string
  createdAt: string
  createdBy?: string | null
}

export interface SmsDevice {
  id: string
  name: string
  scope: DeviceScope
  companyId: string | null
  status: DeviceStatus
  simSlots: unknown[]
  appVersion: string | null
  lastSeenAt: string | null
  online: boolean
  createdAt: string
}

export interface DashboardStats {
  pendingCount: number
  failedCount24h: number
  sentCount24h: number
  approvedDevices: number
  gatewayMode?: 'mobile_device' | 'text_lk'
  gatewayConfigured?: boolean
  recentActivity: HistoryItem[]
}

export interface TemplatePreviewResult {
  body: string
  chars: number
  segments: number
  encoding: 'GSM-7' | 'UCS-2'
}

export interface PaginatedHistory {
  items: HistoryItem[]
  total: number
  page: number
  pageSize: number
}

export interface PaginatedQueue {
  items: QueueItem[]
  total: number
  page: number
  pageSize: number
}
