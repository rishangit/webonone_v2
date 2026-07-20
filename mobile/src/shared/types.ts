export type SmsRole = 'super_admin' | 'company_admin' | 'member'

export type DeviceScope = 'platform' | 'company'

export type DeviceStatus = 'pending' | 'approved' | 'revoked'

export interface UserProfile {
  id: string
  email: string
  role: SmsRole
  companyId: string | null
  scope: DeviceScope | null
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
