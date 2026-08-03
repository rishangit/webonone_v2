export type DesignRole = 'super_admin' | 'company_admin' | 'member'

export type FormFieldType = 'text' | 'textarea' | 'checkbox' | 'radio' | 'select'
export type FormTemplateStatus = 'draft' | 'published'

export type FormFieldOption = {
  id: string
  label: string
}

export type FormField = {
  id: string
  type: FormFieldType
  label: string
  required?: boolean
  placeholder?: string
  options?: FormFieldOption[]
}

export type FormDefinition = {
  version: 1
  fields: FormField[]
}

export type FormTemplate = {
  id: string
  companyId: string
  name: string
  slug: string
  definition: FormDefinition
  status: FormTemplateStatus
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
