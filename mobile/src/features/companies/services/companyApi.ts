import type { DataEntityKey } from '@webonone/platform-nav'
import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { RegisterCompanyFormValues } from '@/features/companies/schemas/companySchemas'

export type CompanyStatus = 'pending' | 'approved' | 'rejected'

export type CompanyDataEntity = DataEntityKey

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

export type AdminCompany = {
  id: string
  name: string
  logoUrl: string | null
  status: CompanyStatus
  createdByUserId: string
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

export type CompanyTag = {
  id: string
  name: string
  color: string
}

export type CompanyGalleryImage = {
  mediaId: string
  url: string
}

export type CompanyContactPerson = {
  id: string
  displayName: string
  email: string | null
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

export type CompanyDetail = {
  id: string
  name: string
  webSlug: string
  webUrl: string
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
  status: CompanyStatus
  createdByUserId: string
  createdAt: string
  approvedAt: string | null
  role?: 'member' | 'company_admin'
}

const client = createApiClient(env.webononeApiBaseUrl)

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
  async listMyCompanies() {
    const data = await client<{ items: MyCompanySummary[] }>('/company/me/companies')
    return data.items
  },

  async listAllCompanies() {
    const data = await client<{ items: AdminCompany[] }>('/company/admin/companies')
    return data.items
  },

  async updateCompanyStatus(id: string, status: CompanyStatus) {
    return client(`/company/admin/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  },

  async registerCompany(body: RegisterCompanyFormValues) {
    return client<{ company: { id: string } }>('/company/register', {
      method: 'POST',
      body: toRegisterApiBody(body),
    })
  },

  async updateCompany(id: string, body: UpdateCompanyBody) {
    return client<CompanyDetail>(`/company/${id}`, {
      method: 'PATCH',
      body,
    })
  },

  async searchDiscoverableCompanies(params: { q?: string; page?: number; pageSize?: number }) {
    const search = new URLSearchParams()
    if (params.q?.trim()) search.set('q', params.q.trim())
    if (params.page !== undefined) search.set('page', String(params.page))
    if (params.pageSize !== undefined) search.set('pageSize', String(params.pageSize))
    const query = search.toString()
    return client<DiscoverCompaniesResult>(`/company/discover${query ? `?${query}` : ''}`)
  },

  async connectCompany(companyId: string) {
    return client<MyCompanySummary>(`/company/${companyId}/connect`, {
      method: 'POST',
    })
  },

  async getCompany(id: string) {
    return client<CompanyDetail>(`/company/${id}`)
  },
}
