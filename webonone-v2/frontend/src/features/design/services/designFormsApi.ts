import { getAccessToken } from '@/shared/services/apiClient'
import { getDesignApiBaseUrl } from '@/features/design/utils/designConfig'

export type DesignFormTemplateListItem = {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published'
}

export type DesignFormSubmissionListItem = {
  id: string
  formTemplateId?: string
  formName: string
  subjectUserId: string
  sessionTokenId: string | null
  eventId: string | null
  occurrenceDate: string | null
  createdAt: string
}

async function designFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${getDesignApiBaseUrl().replace(/\/$/, '')}${path}`, {
    ...options,
    headers,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? 'Design API request failed')
  }
  return data as T
}

export const designFormsApi = {
  listPublished(pageSize = 100) {
    return designFetch<{
      items: DesignFormTemplateListItem[]
      total: number
    }>(`/forms?status=published&pageSize=${pageSize}`)
  },

  listSubmissionsForSession(eventId: string, occurrenceDate: string) {
    const params = new URLSearchParams({
      eventId,
      occurrenceDate,
      pageSize: '100',
    })
    return designFetch<{
      items: DesignFormSubmissionListItem[]
      total: number
    }>(`/submissions?${params.toString()}`)
  },
}
