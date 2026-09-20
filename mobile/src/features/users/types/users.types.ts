export type UserPickerRole = 'super_admin' | 'company_admin' | 'member'

export type UserPickerUser = {
  id: string
  displayName: string
  email: string | null
  role?: UserPickerRole | string
  avatarUrl: string | null
  phoneNumber?: string | null
  companyId?: string
  addedAt?: string
  isEmailVerified?: boolean
  isPhoneVerified?: boolean
}

export type IdentityUserDetail = {
  id: string
  email: string | null
  displayName: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  country: string | null
  avatarUrl: string | null
  locale: string | null
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isGoogleUser: boolean
  role?: UserPickerRole | string
}

export type ListUsersParams = {
  search?: string
  role?: UserPickerRole | null
  page: number
  pageSize: number
  excludeCompanyId?: string | null
}

export type ListCustomersParams = {
  companyId: string
  search?: string
  page: number
  pageSize: number
}

export type ListUsersResponse = {
  items: UserPickerUser[]
  total: number
  page: number
  pageSize: number
}

export type CreateCustomerParams = {
  companyId: string
  firstName: string
  lastName: string
  email?: string
  phoneNumber?: string
  companyName?: string
}

export type AddCustomerParams = {
  companyId: string
  userId: string
  companyName?: string
}
