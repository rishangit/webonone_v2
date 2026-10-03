import { z } from 'zod'

const feedbackTypeSchema = z.enum(['bug', 'feature'])
const feedbackStatusSchema = z.enum([
  'todo',
  'ready_to_develop',
  'planned',
  'in_progress',
  'developed',
  'staging',
  'closed',
])

export const feedbackReportSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  type: feedbackTypeSchema,
  title: z.string(),
  description: z.string(),
  status: feedbackStatusSchema,
  reporterUserId: z.string(),
  reporterEmail: z.string(),
  uploadSessionId: z.string().nullable(),
  attachmentMediaId: z.string().nullable(),
  attachmentUrl: z.string().nullable(),
  attachmentFileName: z.string().nullable(),
  attachmentMimeType: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const feedbackListResultSchema = z.object({
  items: z.array(feedbackReportSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
})

export type FeedbackReport = z.infer<typeof feedbackReportSchema>
export type FeedbackListResult = z.infer<typeof feedbackListResultSchema>
export type FeedbackType = z.infer<typeof feedbackTypeSchema>
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>

export interface SupportApiConfig {
  baseUrl: string
  automationApiKey: string
}

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export class SupportFeedbackApi {
  private readonly baseUrl: string
  private readonly automationApiKey: string

  constructor(config: SupportApiConfig) {
    this.baseUrl = trimTrailingSlash(config.baseUrl)
    this.automationApiKey = config.automationApiKey.trim()
  }

  static fromEnv(): SupportFeedbackApi {
    const baseUrl = process.env.SUPPORT_API_BASE_URL?.trim()
    const automationApiKey = process.env.SUPPORT_FEEDBACK_AUTOMATION_API_KEY?.trim()
    if (!baseUrl) {
      throw new Error('SUPPORT_API_BASE_URL is required')
    }
    if (!automationApiKey) {
      throw new Error('SUPPORT_FEEDBACK_AUTOMATION_API_KEY is required')
    }
    return new SupportFeedbackApi({ baseUrl, automationApiKey })
  }

  private authHeaders(): Record<string, string> {
    return { 'X-Support-Feedback-Automation-Key': this.automationApiKey }
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...this.authHeaders(),
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })

    const text = await res.text()
    let body: unknown = null
    if (text) {
      try {
        body = JSON.parse(text) as unknown
      } catch {
        body = text
      }
    }

    if (!res.ok) {
      const detail =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as { message: string }).message)
          : text || res.statusText
      throw new Error(`Support API ${res.status}: ${detail}`)
    }

    return body as T
  }

  async listFeedback(params: {
    page?: number
    pageSize?: number
    type?: FeedbackType
    status?: FeedbackStatus
    ticket?: string
    q?: string
  }): Promise<FeedbackListResult> {
    const search = new URLSearchParams()
    search.set('page', String(params.page ?? 1))
    search.set('pageSize', String(params.pageSize ?? 12))
    if (params.type) search.set('type', params.type)
    if (params.status) search.set('status', params.status)
    if (params.ticket) search.set('ticket', params.ticket)
    if (params.q) search.set('q', params.q)

    const raw = await this.request<unknown>(`/feedback?${search.toString()}`)
    return feedbackListResultSchema.parse(raw)
  }

  async getFeedback(id: string): Promise<FeedbackReport> {
    const raw = await this.request<unknown>(`/feedback/${encodeURIComponent(id)}`)
    return feedbackReportSchema.parse(raw)
  }

  async getFeedbackByTicket(ticketNumber: string): Promise<FeedbackReport> {
    const raw = await this.request<unknown>(
      `/feedback/ticket/${encodeURIComponent(ticketNumber)}`,
    )
    return feedbackReportSchema.parse(raw)
  }

  async updateStatus(id: string, status: FeedbackStatus): Promise<FeedbackReport> {
    const raw = await this.request<unknown>(`/feedback/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return feedbackReportSchema.parse(raw)
  }
}
