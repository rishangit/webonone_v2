import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { DeviceScope, SmsRole, UserProfile } from '@/shared/types'

const identityClient = createApiClient(env.identityApiBaseUrl)
const smsClient = createApiClient(env.smsApiBaseUrl)

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

  /** Exchange a Google ID token for an Identity access token. */
  async googleLogin(idToken: string): Promise<{ accessToken: string }> {
    const result = await identityClient<IdentityLoginResponse>('/auth/google', {
      method: 'POST',
      body: { idToken },
      bearer: null,
    })
    return { accessToken: result.accessToken }
  },

  /** Resolve the SMS role/scope for the signed-in user (uses the stored token). */
  async fetchProfile(companyName: string | null = null): Promise<UserProfile> {
    const { user } = await smsClient<SmsMeResponse>('/me')
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.role === 'company_admin' ? companyName : null,
      scope: scopeForRole(user.role),
    }
  },
}
