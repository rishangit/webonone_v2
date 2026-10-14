export type DesignRole = 'super_admin' | 'company_admin' | 'member'

export type FormFieldType = 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'media'

export type FormMediaFileRef = {
  fileId: string
  url: string
  fileName?: string
  mimeType?: string
}
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
  /** When type is `media`, allow one or many document uploads. */
  allowMultiple?: boolean
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

export type FormSubmission = {
  id: string
  companyId: string
  formTemplateId: string
  formName: string
  subjectUserId: string
  subjectDisplayName: string
  subjectEmail: string | null
  filledByUserId: string
  filledByDisplayName: string
  serviceId: string | null
  serviceName: string | null
  eventId: string | null
  occurrenceDate: string | null
  sessionTokenId: string | null
  answers: Record<string, unknown>
  createdAt: string
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
