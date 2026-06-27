import { apiClient } from '@/shared/services/apiClient'
import { getPhoneCountryByIso2 } from '@webonone/ui-kit'
import type { RegisterCompanyFormValues } from '../schemas/companySchemas'

export type CompanyStatus = 'pending' | 'approved' | 'rejected'

export type CompanySummary = {
  company: {
    id: string
    name: string
    logoUrl: string | null
    status: CompanyStatus
    createdAt: string
    approvedAt: string | null
  }
  membership: {
    role: 'member' | 'company_admin'
  }
}

export type AdminCompany = {
  id: string
  name: string
  logoUrl: string | null
  status: CompanyStatus
  createdByUserId: string
  createdAt: string
  approvedAt: string | null
}

export type SuperAdminProfile = {
  id: string
  email: string
  displayName: string
}

function toRegisterApiBody(values: RegisterCompanyFormValues) {
  const { countryIso2, stateRegion, postalCode, ...rest } = values
  const country = getPhoneCountryByIso2(countryIso2)?.name ?? countryIso2
  return {
    ...rest,
    country,
    stateRegion: stateRegion.trim() || undefined,
    postalCode: postalCode.trim() || undefined,
  }
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

  async registerCompany(body: RegisterCompanyFormValues) {
    return apiClient<CompanySummary>('/company/register', {
      method: 'POST',
      body: JSON.stringify(toRegisterApiBody(body)),
    })
  },

  async getSuperAdminMe(): Promise<SuperAdminProfile | null> {
    try {
      return await apiClient<SuperAdminProfile>('/company/admin/me')
    } catch {
      return null
    }
  },

  async listAllCompanies() {
    const data = await apiClient<{ items: AdminCompany[] }>('/company/admin/companies')
    return data.items
  },

  async updateCompanyStatus(id: string, status: CompanyStatus) {
    return apiClient<CompanySummary>(`/company/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
