import { getAiApiBase } from './aiConfig'

const GUEST_STORAGE_KEY = 'ai_guest'

type GuestSession = { accessToken: string }

function readGuestToken(): string | null {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GuestSession
    return parsed.accessToken || null
  } catch {
    return null
  }
}

function writeGuestToken(accessToken: string) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ accessToken }))
}

export async function resolveAiAccessToken(identityToken: string | null): Promise<string> {
  if (identityToken) {
    return identityToken
  }

  const existing = readGuestToken()
  if (existing) {
    return existing
  }

  const res = await fetch(`${getAiApiBase()}/guest-sessions`, { method: 'POST' })
  const data = (await res.json().catch(() => ({}))) as { accessToken?: string; message?: string }
  if (!res.ok || !data.accessToken) {
    throw new Error(data.message ?? 'Could not start assistant session')
  }
  writeGuestToken(data.accessToken)
  return data.accessToken
}

export function clearAiGuestSession() {
  localStorage.removeItem(GUEST_STORAGE_KEY)
}

export async function aiFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${accessToken}`,
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${getAiApiBase()}${path}`, { ...options, headers })
  const data = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) {
    if (res.status === 401) {
      clearAiGuestSession()
    }
    throw new Error(data.message ?? 'Assistant request failed')
  }
  return data
}
