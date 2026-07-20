import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { DeviceScope, SmsRole, UserProfile } from '@/shared/types'

const identityClient = createApiClient(`${env.identityApiBaseUrl}/api/v1`)
const smsClient = createApiClient(`${env.smsApiBaseUrl}/api/v1`)

interface IdentityLoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: { id: string; email: string }
  platformRole?: string
  companyId?: string | null
}

interface SmsMeResponse {
  user: { id: string; email: string; role: SmsRole; companyId: string | null }
}

function scopeForRole(role: SmsRole): DeviceScope | null {
  if (role === 'super_admin') return 'platform'
  if (role === 'company_admin') return 'company'
  return null
}

export const authApi = {
  /** Authenticate against Identity and return the raw access token. */
  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const result = await identityClient<IdentityLoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      bearer: null,
    })
    return { accessToken: result.accessToken }
  },

  /** Resolve the SMS role/scope for the signed-in user (uses the stored token). */
  async fetchProfile(): Promise<UserProfile> {
    const { user } = await smsClient<SmsMeResponse>('/me')
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      scope: scopeForRole(user.role),
    }
  },
}
