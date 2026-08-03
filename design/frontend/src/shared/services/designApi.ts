import { apiClient } from '@/shared/services/apiClient'
import type {
  FormDefinition,
  FormTemplate,
  FormTemplateStatus,
  PaginatedResult,
} from '@/shared/types/design.types'
import type { CatalogListQuery } from '@webonone/store-kit'

function toQueryString(query: CatalogListQuery): string {
  const params = new URLSearchParams()
  if (query.page != null) params.set('page', String(query.page))
  if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
  if (query.q) params.set('q', query.q)
  if (query.status && query.status !== 'all') params.set('status', query.status)
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

export const designApi = {
  listForms(query: CatalogListQuery = {}) {
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
}
