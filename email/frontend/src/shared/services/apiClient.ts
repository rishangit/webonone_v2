import type { RootState } from '@/app/store'

let getToken: () => string | null = () => null

export function setTokenGetter(getter: () => string | null) {
  getToken = getter
}

export function initApiClient(store: { getState: () => RootState }) {
  setTokenGetter(() => store.getState().auth.accessToken)
}

export function getAccessToken(): string | null {
  return getToken()
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4014/api/v1'

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  }

  if (!headers['Content-Type'] && !(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message ?? 'Request failed')
  }
  return data as T
}

export { API_BASE }
