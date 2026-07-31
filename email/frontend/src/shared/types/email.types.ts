export type EmailTemplateScope = 'platform' | 'company'

export type MessageStatus = 'sent' | 'failed'

export type QueueStatus = 'pending' | 'processing' | 'failed'

export interface HistoryItem {
  id: string
  recipient: string
  templateSlug: string
  status: MessageStatus
  sentAt: string
  errorMessage: string | null
  queueId?: string | null
  companyId?: string | null
}

export interface QueueItem {
  id: string
  toEmail: string
  templateSlug: string
  status: QueueStatus
  retryCount: number
  createdAt: string
  lastError: string | null
}

export interface EmailTemplate {
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
  /** True when this is a platform default shown until the company saves an override. */
  isDefault?: boolean
}

export interface TemplateVersion {
  id: string
  versionNumber: number
  subject: string
  createdAt: string
  createdBy?: string | null
}

export interface DashboardStats {
  pendingCount: number
  failedCount24h: number
  sentCount24h: number
  recentActivity: HistoryItem[]
}

export interface CompanyBranding {
  companyId: string
  name: string
  logoUrl: string | null
  primaryColor: string | null
  contactEmail: string | null
  footerHtml: string | null
}

export interface ProviderInfo {
  host: string
  port: number
  fromAddress: string
  fromName: string
  connectionStatus: 'connected' | 'disconnected'
  configured: boolean
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

export interface TemplatePreviewResult {
  subject: string
  html: string
  text: string
}
