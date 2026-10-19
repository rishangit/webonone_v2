import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'

export type DashboardCompanyStatus = 'pending' | 'approved' | 'rejected'

export type DashboardCompany = {
  id: string
  name: string
  logoUrl: string | null
  status: DashboardCompanyStatus
  createdAt: string
}

const client = createApiClient(env.webononeApiBaseUrl)

export const adminCompaniesApi = {
  async listAllCompanies() {
    const data = await client<{ items: DashboardCompany[] }>('/company/admin/companies')
    return data.items
  },
}
