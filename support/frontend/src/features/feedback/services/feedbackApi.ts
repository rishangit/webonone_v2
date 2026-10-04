import { apiClient } from '@/shared/services/apiClient'
import type {
  CreateFeedbackFormValues,
  FeedbackCommentFormValues,
  FeedbackStatus,
  FeedbackType,
  UpdateFeedbackFormValues,
} from '@/features/feedback/schemas/feedbackSchemas'

export interface FeedbackReport {
  id: string
  ticketNumber: string
  type: FeedbackType
  title: string
  description: string
  status: FeedbackStatus
  reporterUserId: string
  reporterEmail: string
  uploadSessionId: string | null
  attachmentMediaId: string | null
  attachmentUrl: string | null
  attachmentFileName: string | null
  attachmentMimeType: string | null
  createdAt: string
  updatedAt: string
  unreadCommentCount?: number
}

export interface FeedbackComment {
  id: string
  feedbackReportId: string
  authorUserId: string
  authorEmail: string
  body: string
  createdAt: string
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

  getById(id: string): Promise<FeedbackReport> {
    return apiClient<FeedbackReport>(`/feedback/${id}`)
  },

  getByTicket(ticketNumber: string): Promise<FeedbackReport> {
    return apiClient<FeedbackReport>(`/feedback/ticket/${ticketNumber}`)
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

  update(id: string, body: UpdateFeedbackFormValues): Promise<FeedbackReport> {
    return apiClient<FeedbackReport>(`/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  listComments(feedbackId: string): Promise<{ items: FeedbackComment[] }> {
    return apiClient<{ items: FeedbackComment[] }>(`/feedback/${feedbackId}/comments`)
  },

  createComment(feedbackId: string, body: FeedbackCommentFormValues): Promise<FeedbackComment> {
    return apiClient<FeedbackComment>(`/feedback/${feedbackId}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  markViewed(feedbackId: string): Promise<void> {
    return apiClient<void>(`/feedback/${feedbackId}/viewed`, { method: 'POST' })
  },
}
