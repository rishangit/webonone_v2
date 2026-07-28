export type UserPickerRole = 'super_admin' | 'company_admin' | 'member'

export type UserPickerUser = {
  id: string
  displayName: string
  email: string | null
  role?: UserPickerRole
  avatarUrl: string | null
  phone?: string | null
  companyId?: string
  addedAt?: string
  isEmailVerified?: boolean
}

/** Full profile for admin user detail (`GET /users/:id`). */
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
  isGoogleUser: boolean
  role?: UserPickerRole
}

export type ListUsersParams = {
  search: string
  role: UserPickerRole | null
  page: number
  pageSize: number
  excludeCompanyId?: string | null
}

export type ListUsersResponse = {
  items: UserPickerUser[]
  total: number
  page: number
  pageSize: number
}

export type ListCustomersParams = {
  companyId: string
  search: string
  page: number
  pageSize: number
}

export type AddCustomerParams = {
  companyId: string
  userId: string
  companyName?: string
}

export type CreateCustomerParams = {
  companyId: string
  firstName: string
  lastName: string
  email?: string
  phoneNumber: string
  companyName?: string
}

export type AddCustomerResponse = UserPickerUser & {
  warnings?: string[]
}
