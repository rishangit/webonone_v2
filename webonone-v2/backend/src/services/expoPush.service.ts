import { env } from '../config/env.js'
import * as pushDeviceRepo from '../repositories/pushDevice.repository.js'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const ANDROID_CHANNEL_ID = 'webonone-alerts'
const CHUNK_SIZE = 100

export type PushNotificationPayload = {
  userId: string
  id: string
  title: string
  body: string | null
  href: string | null
}

type ExpoPushTicket = {
  status?: string
  message?: string
  details?: { error?: string }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

async function postExpoPush(messages: Record<string, unknown>[]): Promise<ExpoPushTicket[]> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  }
  if (env.expoAccessToken) {
    headers.Authorization = `Bearer ${env.expoAccessToken}`
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  })
  const payload = (await response.json()) as { data?: ExpoPushTicket[]; errors?: unknown }
  if (!response.ok) {
    throw new Error(`Expo Push HTTP ${response.status}`)
  }
  return Array.isArray(payload.data) ? payload.data : []
}

/** Fire-and-forget OS tray push for a stored in-app notification. Never throws. */
export async function sendPushForNotification(payload: PushNotificationPayload): Promise<void> {
  try {
    const tokens = await pushDeviceRepo.listTokensForUser(payload.userId)
    if (tokens.length === 0) return

    const stale: string[] = []
    for (const tokenChunk of chunk(tokens, CHUNK_SIZE)) {
      const bodyText = payload.body?.trim() ? payload.body.trim() : payload.title
      const messages = tokenChunk.map((to) => ({
        to,
        title: payload.title,
        body: bodyText,
        sound: 'default',
        priority: 'high',
        channelId: ANDROID_CHANNEL_ID,
        android: {
          channelId: ANDROID_CHANNEL_ID,
          priority: 'high',
          sound: 'default',
          visibility: 'public',
        },
        data: {
          href: payload.href ?? '',
          notificationId: payload.id,
        },
      }))
      const tickets = await postExpoPush(messages)
      tickets.forEach((ticket, index) => {
        if (ticket.status !== 'error') return
        const token = tokenChunk[index]
        const detail = ticket.details?.error ?? ticket.message ?? 'unknown'
        console.error(`[notifications] Expo push error for token ${token ?? '?'}: ${detail}`)
        if (ticket.details?.error === 'DeviceNotRegistered' && token) {
          stale.push(token)
        }
      })
    }

    await pushDeviceRepo.deletePushDevicesByTokens(stale)
  } catch (err) {
    console.error('[notifications] sendPushForNotification failed:', err)
  }
}
