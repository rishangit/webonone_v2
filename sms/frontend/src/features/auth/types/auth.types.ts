export type SmsRole = 'super_admin' | 'company_admin' | 'member'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  role: SmsRole
  companyId?: string | null
}
