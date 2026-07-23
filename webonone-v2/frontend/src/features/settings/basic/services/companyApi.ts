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

export type MyCompanySummary = {
  id: string
  name: string
  logoUrl: string | null
  status: CompanyStatus
  role: 'member' | 'company_admin'
  createdAt: string
  approvedAt: string | null
}

export type CompanyGalleryImage = {
  mediaId: string
  url: string
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
}

function toRegisterApiBody(values: RegisterCompanyFormValues) {
  const { countryIso2, stateRegion, postalCode, description, companySize, ...rest } = values
  const country =
    countryIso2.trim().length > 0
      ? (getPhoneCountryByIso2(countryIso2)?.name ?? countryIso2)
      : undefined

  return {
    name: rest.name,
    ...(description.trim() ? { description: description.trim() } : {}),
    ...(companySize ? { companySize } : {}),
    ...(rest.addressLine1.trim() ? { addressLine1: rest.addressLine1.trim() } : {}),
    ...(rest.addressLine2.trim() ? { addressLine2: rest.addressLine2.trim() } : {}),
    ...(rest.city.trim() ? { city: rest.city.trim() } : {}),
    ...(stateRegion.trim() ? { stateRegion: stateRegion.trim() } : {}),
    ...(postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
    ...(country ? { country } : {}),
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
