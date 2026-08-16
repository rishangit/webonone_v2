import type { AiRole } from '@/features/auth/types/auth.types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4020/api/v1'

export async function fetchAiRole(accessToken: string): Promise<AiRole> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = (await res.json().catch(() => ({}))) as {
    user?: { role?: AiRole }
    message?: string
  }
  if (!res.ok || !data.user?.role) {
    throw new Error(data.message ?? 'Failed to load user role')
  }
  return data.user.role
}
