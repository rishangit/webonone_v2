import { apiClient } from '@/shared/services/apiClient'
import type {
  FormDefinition,
  FormSubmission,
  FormTemplate,
  FormTemplateStatus,
  PaginatedResult,
} from '@/shared/types/design.types'

type ListQuery = {
  page?: number
  pageSize?: number
  q?: string
  status?: string
  subjectUserId?: string
  filledByUserId?: string
  sessionTokenId?: string
  eventId?: string
  occurrenceDate?: string
}

function toQueryString(query: ListQuery): string {
  const params = new URLSearchParams()
  if (query.page != null) params.set('page', String(query.page))
  if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
  if (query.q) params.set('q', query.q)
  if (query.status && query.status !== 'all') params.set('status', query.status)
  if (query.subjectUserId) params.set('subjectUserId', query.subjectUserId)
  if (query.filledByUserId) params.set('filledByUserId', query.filledByUserId)
  if (query.sessionTokenId) params.set('sessionTokenId', query.sessionTokenId)
  if (query.eventId) params.set('eventId', query.eventId)
  if (query.occurrenceDate) params.set('occurrenceDate', query.occurrenceDate)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export type CreateFormBody = {
  name: string
  slug: string
  definition?: FormDefinition
  status?: FormTemplateStatus
}

export type UpdateFormBody = {
  name?: string
  slug?: string
  definition?: FormDefinition
  status?: FormTemplateStatus
}

export type CreateSubmissionBody = {
  formTemplateId: string
  subjectUserId: string
  serviceId?: string | null
  eventId?: string | null
  occurrenceDate?: string | null
  sessionTokenId?: string | null
  answers: Record<string, unknown>
}

export const designApi = {
  listForms(query: ListQuery = {}) {
    return apiClient<PaginatedResult<FormTemplate>>(`/forms${toQueryString(query)}`)
  },
  async getForm(id: string) {
    const data = await apiClient<{ form: FormTemplate }>(`/forms/${id}`)
    return data.form
  },
  async createForm(body: CreateFormBody) {
    const data = await apiClient<{ form: FormTemplate }>('/forms', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.form
  },
  async updateForm(id: string, body: UpdateFormBody) {
    const data = await apiClient<{ form: FormTemplate }>(`/forms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return data.form
  },
  deleteForm(id: string) {
    return apiClient<void>(`/forms/${id}`, { method: 'DELETE' })
  },
  listSubmissions(query: {
    page?: number
    pageSize?: number
    subjectUserId?: string
    filledByUserId?: string
    sessionTokenId?: string
    eventId?: string
    occurrenceDate?: string
  } = {}) {
    return apiClient<PaginatedResult<FormSubmission>>(`/submissions${toQueryString(query)}`)
  },
  async getSubmission(id: string) {
    const data = await apiClient<{ submission: FormSubmission }>(`/submissions/${id}`)
    return data.submission
  },
  async createSubmission(body: CreateSubmissionBody) {
    const data = await apiClient<{ submission: FormSubmission }>('/submissions', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return data.submission
  },
}
