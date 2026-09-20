import { profileFormToUpdateInput } from '@/features/profile/profileSchemas'
import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { DeviceScope, SessionRole, UserProfile } from '@/shared/types'

type UpdateProfileBody = ReturnType<typeof profileFormToUpdateInput>

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
  user: { id: string; email: string; role: SessionRole; companyId: string | null }
}

export interface IdentityProfile {
  id: string
  email: string | null
  displayName: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  country: string | null
  avatarUrl: string | null
  locale: string | null
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isGoogleUser: boolean
}

interface IdentityMeResponse {
  user: IdentityProfile
}

function scopeForRole(role: SessionRole): DeviceScope | null {
  if (role === 'super_admin') return 'platform'
  if (role === 'company_admin') return 'company'
  return null
}

export const authApi = {
  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const result = await identityClient<IdentityLoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      bearer: null,
    })
    return { accessToken: result.accessToken }
  },

  async googleLogin(idToken: string): Promise<{ accessToken: string }> {
    const result = await identityClient<IdentityLoginResponse>('/auth/google', {
      method: 'POST',
      body: { idToken },
      bearer: null,
    })
    return { accessToken: result.accessToken }
  },

  async requestRegisterEmailOtp(email: string): Promise<void> {
    await identityClient<{ message: string }>('/auth/register/request-email-otp', {
      method: 'POST',
      body: { email },
      bearer: null,
    })
  },

  async verifyRegisterEmailOtp(email: string, otp: string): Promise<{ registrationSessionToken: string }> {
    return identityClient<{ registrationSessionToken: string; expiresAt: string }>(
      '/auth/register/verify-email-otp',
      {
        method: 'POST',
        body: { email, otp },
        bearer: null,
      },
    )
  },

  async completeRegistration(input: {
    registrationSessionToken: string
    firstName: string
    lastName: string
    password: string
  }): Promise<void> {
    await identityClient<{ user: IdentityProfile }>('/auth/register/complete', {
      method: 'POST',
      body: input,
      bearer: null,
    })
  },

  async forgotPassword(email: string): Promise<void> {
    await identityClient<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      bearer: null,
    })
  },

  async verifyResetOtp(email: string, otp: string): Promise<{ resetSessionToken: string }> {
    return identityClient<{ resetSessionToken: string; expiresAt: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: { email, otp },
      bearer: null,
    })
  },

  async previewResetPassword(resetSessionToken: string): Promise<{
    email: string | null
    firstName: string
    lastName: string
  }> {
    const result = await identityClient<{
      user: { email: string | null; firstName: string; lastName: string }
    }>('/auth/reset-password/preview', {
      method: 'POST',
      body: { resetSessionToken },
      bearer: null,
    })
    return result.user
  },

  async resetPassword(resetSessionToken: string, newPassword: string): Promise<void> {
    await identityClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { resetSessionToken, newPassword },
      bearer: null,
    })
  },

  async fetchIdentityMe(): Promise<IdentityProfile> {
    const result = await identityClient<IdentityMeResponse>('/auth/me')
    return result.user
  },

  async patchIdentityMe(body: UpdateProfileBody): Promise<IdentityProfile> {
    const result = await identityClient<IdentityMeResponse>('/auth/me', {
      method: 'PATCH',
      body,
    })
    return result.user
  },

  async requestProfileEmailOtp(): Promise<void> {
    await identityClient<{ message: string }>('/auth/me/email/request-otp', {
      method: 'POST',
      body: {},
    })
  },

  async verifyProfileEmailOtp(otp: string): Promise<IdentityProfile> {
    const result = await identityClient<IdentityMeResponse>('/auth/me/email/verify-otp', {
      method: 'POST',
      body: { otp },
    })
    return result.user
  },

  async requestProfilePhoneOtp(): Promise<void> {
    await identityClient<{ message: string }>('/auth/me/phone/request-otp', {
      method: 'POST',
      body: {},
    })
  },

  async verifyProfilePhoneOtp(otp: string): Promise<IdentityProfile> {
    const result = await identityClient<IdentityMeResponse>('/auth/me/phone/verify-otp', {
      method: 'POST',
      body: { otp },
    })
    return result.user
  },

  async fetchProfile(input: {
    companyName: string | null
    accountKind?: 'staff'
  }): Promise<UserProfile> {
    const [{ user }, identityUser] = await Promise.all([
      smsClient<SmsMeResponse>('/me'),
      authApi.fetchIdentityMe().catch(() => null),
    ])

    return {
      id: user.id,
      email: user.email,
      displayName: identityUser?.displayName ?? user.email,
      avatarUrl: identityUser?.avatarUrl ?? null,
      role: user.role,
      companyId: user.companyId,
      companyName: user.role === 'super_admin' ? null : input.companyName,
      accountKind: input.accountKind,
      scope: scopeForRole(user.role),
      locale:
        identityUser?.locale === 'en' || identityUser?.locale === 'si' ? identityUser.locale : null,
    }
  },
}
