import { apiClient } from '@/shared/services/apiClient'
import type { CreateFeedbackFormValues, FeedbackStatus, FeedbackType } from '@/features/feedback/schemas/feedbackSchemas'

export interface FeedbackReport {
  id: string
  type: FeedbackType
  title: string
  description: string
  status: FeedbackStatus
  reporterUserId: string
  reporterEmail: string
  createdAt: string
  updatedAt: string
}

export interface FeedbackListResult {
  items: FeedbackReport[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface FeedbackListQuery {
  page: number
  pageSize: number
  type?: FeedbackType
  status?: FeedbackStatus
  q?: string
}

export const feedbackApi = {
  list(query: FeedbackListQuery): Promise<FeedbackListResult> {
    const params = new URLSearchParams()
    params.set('page', String(query.page))
    params.set('pageSize', String(query.pageSize))
    if (query.type) params.set('type', query.type)
    if (query.status) params.set('status', query.status)
    if (query.q) params.set('q', query.q)
    return apiClient<FeedbackListResult>(`/feedback?${params.toString()}`)
  },

  create(body: CreateFeedbackFormValues): Promise<FeedbackReport> {
    return apiClient<FeedbackReport>('/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateStatus(id: string, status: FeedbackStatus): Promise<FeedbackReport> {
    return apiClient<FeedbackReport>(`/feedback/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
