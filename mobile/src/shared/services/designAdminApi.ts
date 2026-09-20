import { env } from '@/shared/config/env'
import type {
  DesignListQuery,
  DesignPaginatedResult,
  FormDefinition,
  FormSubmission,
  FormTemplate,
  FormTemplateStatus,
} from '@/shared/types/design.types'
import { createApiClient } from './apiClient'

const client = createApiClient(env.designApiBaseUrl)

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
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

export const designAdminApi = {
  listForms(query: DesignListQuery = {}) {
    return client<DesignPaginatedResult<FormTemplate>>(
      `/forms${toQueryString({
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        status: query.status,
      })}`,
    )
  },

  async getForm(id: string) {
    const data = await client<{ form: FormTemplate }>(`/forms/${id}`)
    return data.form
  },

  async createForm(body: CreateFormBody) {
    const data = await client<{ form: FormTemplate }>('/forms', { method: 'POST', body })
    return data.form
  },

  async updateForm(id: string, body: UpdateFormBody) {
    const data = await client<{ form: FormTemplate }>(`/forms/${id}`, { method: 'PATCH', body })
    return data.form
  },

  deleteForm(id: string) {
    return client<void>(`/forms/${id}`, { method: 'DELETE' })
  },

  async getSubmission(id: string) {
    const data = await client<{ submission: FormSubmission }>(`/submissions/${id}`)
    return data.submission
  },

  async createSubmission(body: CreateSubmissionBody) {
    const data = await client<{ submission: FormSubmission }>('/submissions', {
      method: 'POST',
      body,
    })
    return data.submission
  },
}
