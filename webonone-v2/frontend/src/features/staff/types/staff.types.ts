export type StaffScheduleDay = {
  day_of_week: number
  is_working: boolean
  start_time: string | null
  end_time: string | null
}

export type CompanyStaff = {
  id: string
  companyId: string
  userId: string
  displayName: string
  email: string | null
  avatarUrl: string | null
  isEmailVerified: boolean
  schedule: StaffScheduleDay[]
  createdAt: string
  updatedAt: string
}

export type CreateCompanyStaffBody = {
  user_id: string
  schedule: StaffScheduleDay[]
}

export type UpdateCompanyStaffBody = {
  user_id?: string
  schedule?: StaffScheduleDay[]
}
