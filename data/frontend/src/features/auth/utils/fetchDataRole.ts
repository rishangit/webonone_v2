import type { DataRole } from '@/features/auth/types/auth.types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4015/api/v1'

export async function fetchDataRole(accessToken: string): Promise<DataRole> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = (await res.json().catch(() => ({}))) as {
    user?: { role?: DataRole }
    message?: string
  }
  if (!res.ok || !data.user?.role) {
    throw new Error(data.message ?? 'Failed to load user role')
  }
  return data.user.role
}
