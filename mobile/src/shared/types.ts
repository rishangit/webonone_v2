import type { AppLocale } from '@webonone/i18n'

export type { AppLocale }

export type SessionRole = 'super_admin' | 'company_admin' | 'member'

export type DeviceScope = 'platform' | 'company'

export type DeviceStatus = 'pending' | 'approved' | 'revoked'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: SessionRole
  companyId: string | null
  companyName: string | null
  accountKind?: 'staff'
  scope: DeviceScope | null
  locale?: AppLocale | null
}

/** Sticky post-login role choice (cleared on logout). */
export interface StickySessionRole {
  role: SessionRole
  companyId: string | null
  companyName: string | null
  accountKind?: 'staff'
}

export interface SmsDevice {
  id: string
  name: string
  scope: DeviceScope
  companyId: string | null
  status: DeviceStatus
  appVersion: string | null
  lastSeenAt: string | null
  online?: boolean
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
