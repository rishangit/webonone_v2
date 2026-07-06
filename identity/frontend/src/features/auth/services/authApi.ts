import type {
  AuthSuccessPayload,
  ExchangeAuthPayload,
  UpdateProfileInput,
  UserProfile,
} from '../types/auth.types'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_IDENTITY_API_BASE_URL ??
  'http://localhost:4011/api/v1'

export type AuthApiError = Error & {
  code?: string
  attemptsRemaining?: number
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers, ...rest } = options ?? {}
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error((data.message as string) ?? 'Request failed') as AuthApiError
    err.code = data.code as string | undefined
    if (typeof data.attemptsRemaining === 'number') {
      err.attemptsRemaining = data.attemptsRemaining
    }
    throw err
  }
  return data as T
}

async function authRequest<T>(path: string, accessToken: string, options?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export const authApi = {
  requestRegisterEmailOtp(body: { email: string }) {
    return request<{ message: string }>('/auth/register/request-email-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  verifyRegisterEmailOtp(body: { email: string; otp: string }) {
    return request<{ registrationSessionToken: string; expiresAt: string }>(
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
    return request<{ user: UserProfile }>('/auth/register/complete', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  login(body: { email: string; password: string }) {
    return request<AuthSuccessPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  googleLogin(body: { idToken: string }) {
    return request<AuthSuccessPayload>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  forgotPassword(body: { email: string }) {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  verifyResetOtp(body: { email: string; otp: string }) {
    return request<{ resetSessionToken: string; expiresAt: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  resetPassword(body: { resetSessionToken: string; newPassword: string }) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  resetPasswordWithToken(body: { token: string; newPassword: string }) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  getMe(accessToken: string) {
    return authRequest<{ user: UserProfile }>('/auth/me', accessToken)
  },
  patchMe(accessToken: string, body: UpdateProfileInput) {
    return authRequest<{ user: UserProfile }>('/auth/me', accessToken, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  exchangeCode(code: string, redirectUri: string) {
    return request<ExchangeAuthPayload>('/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code, redirectUri }),
    })
  },
}
