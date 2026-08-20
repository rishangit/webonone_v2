import { apiClient } from '@/shared/services/apiClient'

export type NotificationItem = {
  id: string
  userId: string
  companyId: string | null
  type: string
  title: string
  body: string | null
  href: string | null
  sourceService: string
  sourceEventId: string | null
  readAt: string | null
  createdAt: string
}

export const notificationsApi = {
  list(params?: { limit?: number; before?: string }) {
    const search = new URLSearchParams()
    if (params?.limit) search.set('limit', String(params.limit))
    if (params?.before) search.set('before', params.before)
    const qs = search.toString()
    return apiClient<{ items: NotificationItem[] }>(
      `/notifications${qs ? `?${qs}` : ''}`,
    )
  },
  unreadCount() {
    return apiClient<{ count: number }>('/notifications/unread-count')
  },
  markRead(id: string) {
    return apiClient<NotificationItem>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    })
  },
  markAllRead() {
    return apiClient<{ updated: number }>('/notifications/read-all', {
      method: 'POST',
    })
  },
}
