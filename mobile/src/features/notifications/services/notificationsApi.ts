import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'

const client = createApiClient(env.webononeApiBaseUrl)

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
    return client<{ items: NotificationItem[] }>(`/notifications${qs ? `?${qs}` : ''}`)
  },

  unreadCount() {
    return client<{ count: number }>('/notifications/unread-count')
  },

  markRead(id: string) {
    return client<NotificationItem>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    })
  },

  markAllRead() {
    return client<{ updated: number }>('/notifications/read-all', {
      method: 'POST',
    })
  },

  registerPushDevice(body: { token: string; platform: 'android' | 'ios' }) {
    return client<{ ok: true }>('/notifications/push-devices', {
      method: 'PUT',
      body,
    })
  },

  unregisterPushDevice(token: string) {
    return client<{ ok: true }>('/notifications/push-devices', {
      method: 'DELETE',
      body: { token },
    })
  },
}
