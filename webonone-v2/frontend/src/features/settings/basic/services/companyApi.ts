import { apiClient } from '@/shared/services/apiClient'
import type { RegisterCompanyFormValues } from '../schemas/companySchemas'
import type { DataEntityKey } from '@webonone/platform-nav'

export type CompanyStatus = 'pending' | 'approved' | 'rejected'

export type CompanyDataEntity = DataEntityKey

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

export type MyCompanySummary = {
  id: string
  name: string
  logoUrl: string | null
  status: CompanyStatus
  role: 'member' | 'company_admin'
  dataEntities: CompanyDataEntity[]
  createdAt: string
  approvedAt: string | null
}

export type DiscoverCompanySummary = {
  id: string
  name: string
  logoUrl: string | null
  description: string | null
  city: string | null
  country: string | null
  contactEmail: string | null
}

export type DiscoverCompaniesResult = {
  items: DiscoverCompanySummary[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type CompanyGalleryImage = {
  mediaId: string
  url: string
}

export type CompanyTag = {
  id: string
  name: string
  color: string
}

export type CompanyCatalogCounts = {
  products: number
  services: number
  spaces: number
}

export type CompanyContactPerson = {
  id: string
  displayName: string
  email: string | null
}

export type CompanyDetail = {
  id: string
  name: string
  description: string | null
  companySize: string | null
  logoUrl: string | null
  galleryImages: CompanyGalleryImage[]
  contactEmail: string | null
  contactPhone: string | null
  contactPersonUserId: string | null
  contactPerson: CompanyContactPerson | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  mapPlaceId: string | null
  mapFormattedAddress: string | null
  tags: CompanyTag[]
  dataEntities: CompanyDataEntity[]
  catalogCounts?: CompanyCatalogCounts
  status: CompanyStatus
  createdByUserId: string
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  role?: 'member' | 'company_admin'
}

export type UpdateCompanyBody = {
  name?: string
  description?: string | null
  companySize?: string | null
  logoUrl?: string | null
  galleryImages?: CompanyGalleryImage[] | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactPersonUserId?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  stateRegion?: string | null
  postalCode?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  mapPlaceId?: string | null
  mapFormattedAddress?: string | null
  tags?: CompanyTag[]
  dataEntities?: CompanyDataEntity[]
}

function toRegisterApiBody(values: RegisterCompanyFormValues) {
  const { country, stateRegion, postalCode, description, companySize, ...rest } = values

  return {
    name: rest.name,
    contactPersonUserId: rest.contactPersonUserId,
    ...(description.trim() ? { description: description.trim() } : {}),
    ...(companySize ? { companySize } : {}),
    ...(rest.addressLine1.trim() ? { addressLine1: rest.addressLine1.trim() } : {}),
    ...(rest.addressLine2.trim() ? { addressLine2: rest.addressLine2.trim() } : {}),
    ...(rest.city.trim() ? { city: rest.city.trim() } : {}),
    ...(stateRegion.trim() ? { stateRegion: stateRegion.trim() } : {}),
    ...(postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
    ...(country.trim() ? { country: country.trim() } : {}),
    ...(rest.contactEmail.trim() ? { contactEmail: rest.contactEmail.trim() } : {}),
    ...(rest.contactPhone.trim() ? { contactPhone: rest.contactPhone.trim() } : {}),
  }
}

export const companyApi = {
  async getMyCompany(): Promise<CompanySummary | null> {
    const data = await apiClient<CompanySummary | { company: null; membership: null }>(
      '/company/me',
    )
    return data.company ? (data as CompanySummary) : null
  },

  async listMyCompanies() {
    const data = await apiClient<{ items: MyCompanySummary[] }>('/company/me/companies')
    return data.items
  },

  async searchDiscoverableCompanies(params: {
    q?: string
    page?: number
    pageSize?: number
  }) {
    const search = new URLSearchParams()
    if (params.q?.trim()) {
      search.set('q', params.q.trim())
    }
    if (params.page !== undefined) {
      search.set('page', String(params.page))
    }
    if (params.pageSize !== undefined) {
      search.set('pageSize', String(params.pageSize))
    }
    const query = search.toString()
    return apiClient<DiscoverCompaniesResult>(
      `/company/discover${query ? `?${query}` : ''}`,
    )
  },

  async connectCompany(companyId: string) {
    return apiClient<MyCompanySummary>(`/company/${companyId}/connect`, {
      method: 'POST',
    })
  },

  async getDiscoverableCompany(companyId: string) {
    return apiClient<CompanyDetail>(
      `/company/discover/${encodeURIComponent(companyId)}`,
    )
  },

  async registerCompany(body: RegisterCompanyFormValues) {
    return apiClient<CompanySummary>('/company/register', {
      method: 'POST',
      body: JSON.stringify(toRegisterApiBody(body)),
    })
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

  async getCompany(id: string) {
    return apiClient<CompanyDetail>(`/company/${id}`)
  },

  async updateCompany(id: string, body: UpdateCompanyBody) {
    return apiClient<CompanyDetail>(`/company/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
