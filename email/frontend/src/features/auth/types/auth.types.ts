export type EmailRole = 'super_admin' | 'company_admin' | 'member'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  role: EmailRole
  companyId?: string | null
}
