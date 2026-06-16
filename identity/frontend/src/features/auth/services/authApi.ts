import type { AuthSuccessPayload, UserProfile } from '../types/auth.types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_IDENTITY_API_BASE_URL ?? 'http://localhost:4001/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message ?? 'Request failed')
  }
  return data as T
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
}
