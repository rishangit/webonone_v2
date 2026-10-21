import { apiClient } from '@/shared/services/apiClient'

export type DashboardCompanyStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export type DashboardCompany = {
  id: string
  name: string
  logoUrl: string | null
  status: DashboardCompanyStatus
  createdAt: string
}

export const adminCompaniesApi = {
  async listAllCompanies() {
    const data = await apiClient<{ items: DashboardCompany[] }>('/company/admin/companies')
    return data.items
  },
}
