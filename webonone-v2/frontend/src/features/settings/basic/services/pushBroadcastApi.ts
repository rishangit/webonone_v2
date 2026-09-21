import { apiClient } from '@/shared/services/apiClient'
import type { PushBroadcastFormValues } from '@/features/settings/basic/schemas/pushBroadcastSchemas'

export type PushTargetStats = {
  deviceCount: number
  userCount: number
}

export type PushBroadcastResult = {
  broadcastId: string
  deviceCount: number
  userCount: number
  notificationsCreated: number
}

export const pushBroadcastApi = {
  getTargets() {
    return apiClient<PushTargetStats>('/notifications/admin/push-targets')
  },

  broadcast(body: PushBroadcastFormValues) {
    return apiClient<PushBroadcastResult>('/notifications/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        title: body.title,
        body: body.body?.trim() ? body.body.trim() : null,
        href: body.href?.trim() ? body.href.trim() : null,
      }),
    })
  },
}
