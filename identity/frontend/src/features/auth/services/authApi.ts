import type {
  AuthSuccessPayload,
  ExchangeAuthPayload,
  UpdateProfileInput,
  UserProfile,
} from '../types/auth.types'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_IDENTITY_API_BASE_URL ??
  'http://localhost:4001/api/v1'

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
    throw new Error(data.message ?? 'Request failed')
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
  register(body: { email: string; password: string; firstName: string; lastName: string }) {
    return request<{ user: UserProfile }>('/auth/register', {
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
    return request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  resetPassword(body: { token: string; newPassword: string }) {
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
