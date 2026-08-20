import type { RootState } from '@/app/store'

let getToken: () => string | null = () => null
let onAuthRequired: (() => void) | null = null

export function setTokenGetter(getter: () => string | null) {
  getToken = getter
}

export function setAuthRequiredHandler(handler: (() => void) | null) {
  onAuthRequired = handler
}

export function initApiClient(store: { getState: () => RootState }) {
  setTokenGetter(() => store.getState().auth.accessToken)
}

export function getAccessToken(): string | null {
  return getToken()
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_WEBONONE_API_BASE_URL ??
  'http://localhost:4010/api/v1'

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 204) {
    if (!res.ok) {
      throw new Error('Request failed')
    }
    return undefined as T
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) {
      onAuthRequired?.()
    }
    throw new Error(data.message ?? 'Request failed')
  }
  return data as T
}
