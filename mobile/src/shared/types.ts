export type SmsRole = 'super_admin' | 'company_admin' | 'member'

export type DeviceScope = 'platform' | 'company'

export type DeviceStatus = 'pending' | 'approved' | 'revoked'

export interface UserProfile {
  id: string
  email: string
  role: SmsRole
  companyId: string | null
  /** Company display name when role is company_admin; null for Super Admin. */
  companyName: string | null
  scope: DeviceScope | null
}

/** Sticky post-login role choice (cleared on logout). */
export interface StickySessionRole {
  role: 'super_admin' | 'company_admin'
  companyId: string | null
  companyName: string | null
}

export interface SmsDevice {
  id: string
  name: string
  scope: DeviceScope
  companyId: string | null
  status: DeviceStatus
  appVersion: string | null
  lastSeenAt: string | null
}

export interface DeviceMessage {
  id: string
  toNumber: string
  body: string
  simSlot: number | null
}

export interface DeviceStatusReport {
  status: 'sent' | 'failed'
  simSlot?: number
  providerMessageRef?: string
  error?: string
}
