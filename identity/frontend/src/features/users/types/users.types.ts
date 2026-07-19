export type UserPickerRole = 'super_admin' | 'company_admin' | 'member'

export type UserPickerUser = {
  id: string
  displayName: string
  email: string
  role?: UserPickerRole
  avatarUrl: string | null
}

export type ListUsersParams = {
  search: string
  role: UserPickerRole | null
  page: number
  pageSize: number
}

export type ListUsersResponse = {
  items: UserPickerUser[]
  total: number
  page: number
  pageSize: number
}
