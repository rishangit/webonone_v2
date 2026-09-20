import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { env } from '@/shared/config/env'
import { secureStorage } from '@/shared/services/secureStorage'
import { notificationsApi } from '@/features/notifications/services/notificationsApi'
import { resolveNotificationHref } from '@/features/notifications/utils/notificationNavigation'

export const ANDROID_ALERTS_CHANNEL_ID = 'webonone-alerts'

type PushPlatform = 'android' | 'ios'

function nativePushPlatform(): PushPlatform | null {
  if (Platform.OS === 'android') return 'android'
  if (Platform.OS === 'ios') return 'ios'
  return null
}

function resolveExpoProjectId(): string {
  const fromEnv = env.expoProjectId.trim()
  if (fromEnv) return fromEnv
  const easId = Constants.easConfig?.projectId?.trim()
  if (easId) return easId
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined
  return extra?.eas?.projectId?.trim() ?? ''
}

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  })
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(ANDROID_ALERTS_CHANNEL_ID, {
    name: 'WebOnOne alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })
}

export async function registerPushDevice(): Promise<void> {
  try {
    const platform = nativePushPlatform()
    if (!platform) return
    if (!Device.isDevice) return

    const projectId = resolveExpoProjectId()
    if (!projectId) return

    await ensureAndroidChannel()
    const permission = await Notifications.requestPermissionsAsync()
    if (!permission.granted) return

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    if (!token) return

    await notificationsApi.registerPushDevice({ token, platform })
    await secureStorage.setPushToken(token)
  } catch (err) {
    console.warn('[push] registerPushDevice failed:', err)
  }
}

export async function unregisterPushDevice(): Promise<void> {
  if (!nativePushPlatform()) return
  const token = await secureStorage.getPushToken()
  if (!token) return
  try {
    await notificationsApi.unregisterPushDevice(token)
  } catch {
    /* best-effort — session is ending */
  }
  await secureStorage.clearPushToken()
}

export function hrefFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const href = 'href' in data ? data.href : null
  return typeof href === 'string' && href.trim() ? href.trim() : null
}

export function notificationIdFromData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const id = 'notificationId' in data ? data.notificationId : null
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

export function resolvePushHref(data: unknown) {
  return resolveNotificationHref(hrefFromNotificationData(data))
}
