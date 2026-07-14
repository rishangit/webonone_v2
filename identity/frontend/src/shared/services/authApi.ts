import type {
  AuthSuccessPayload,
  ExchangeAuthPayload,
  UpdateProfileInput,
  UserProfile,
} from '@/shared/types/auth.types'
import { apiClient } from '@/shared/services/apiClient'

export type { ApiClientError as AuthApiError } from '@/shared/services/apiClient'

export const authApi = {
  requestRegisterEmailOtp(body: { email: string }) {
    return apiClient<{ message: string }>('/auth/register/request-email-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  verifyRegisterEmailOtp(body: { email: string; otp: string }) {
    return apiClient<{ registrationSessionToken: string; expiresAt: string }>(
      '/auth/register/verify-email-otp',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  },
  completeRegistration(body: {
    registrationSessionToken: string
    firstName: string
    lastName: string
    password: string
  }) {
    return apiClient<{ user: UserProfile }>('/auth/register/complete', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  login(body: { email: string; password: string }) {
    return apiClient<AuthSuccessPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  googleLogin(body: { idToken: string }) {
    return apiClient<AuthSuccessPayload>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  forgotPassword(body: { email: string }) {
    return apiClient<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  verifyResetOtp(body: { email: string; otp: string }) {
    return apiClient<{ resetSessionToken: string; expiresAt: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  resetPassword(body: { resetSessionToken: string; newPassword: string }) {
    return apiClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  resetPasswordWithToken(body: { token: string; newPassword: string }) {
    return apiClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  getMe() {
    return apiClient<{ user: UserProfile }>('/auth/me')
  },
  patchMe(body: UpdateProfileInput) {
    return apiClient<{ user: UserProfile }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  exchangeCode(code: string, redirectUri: string) {
    return apiClient<ExchangeAuthPayload>('/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code, redirectUri }),
    })
  },
}
