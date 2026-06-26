import { apiClient } from '@/shared/services/apiClient'
import { getSuperAdminToken } from '../utils/superAdminSession'

export type CompanySummary = {
  company: {
    id: string
    name: string
    logoUrl: string | null
    status: 'pending' | 'approved'
    createdAt: string
    approvedAt: string | null
  }
  membership: {
    role: 'member' | 'company_admin'
  }
}

export type PendingCompany = {
  id: string
  name: string
  logoUrl: string | null
  status: 'pending' | 'approved'
  createdByUserId: string
  createdAt: string
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_WEBONONE_API_BASE_URL ??
  'http://localhost:4000/api/v1'

async function superAdminClient<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getSuperAdminToken()
  if (!token) {
    throw new Error('Super admin session required')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options?.headers as Record<string, string>),
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? 'Request failed')
  }
  return data as T
}

export const companyApi = {
  async getMyCompany(): Promise<CompanySummary | null> {
    try {
      return await apiClient<CompanySummary>('/company/me')
    } catch (err) {
      if (err instanceof Error && err.message === 'No company registered') {
        return null
      }
      throw err
    }
  },

  async registerCompany(body: { name: string; logoUrl: string }) {
    return apiClient<CompanySummary>('/company/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  async superAdminLogin(body: { email: string; password: string }) {
    return apiClient<{ accessToken: string; displayName: string }>('/company/super-admin/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  async listPendingCompanies() {
    const data = await superAdminClient<{ items: PendingCompany[] }>('/company/admin/pending')
    return data.items
  },

  async approveCompany(id: string) {
    return superAdminClient<CompanySummary>(`/company/admin/${id}/approve`, { method: 'POST' })
  },
}
