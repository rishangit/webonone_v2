import { Linking } from 'react-native'
import type { Href } from 'expo-router'
import { env } from '@/shared/config/env'

/** Map web notification href paths to native Expo routes when possible. */
export function resolveNotificationHref(href: string | null): Href | null {
  if (!href?.trim()) return null
  const path = href.trim()
  if (path.startsWith('/')) return path as Href
  return null
}

export async function openNotificationHref(href: string | null): Promise<void> {
  const native = resolveNotificationHref(href)
  if (native) return
  if (!href?.trim()) return
  const url = href.startsWith('http') ? href : `${env.webononeOrigin.replace(/\/$/, '')}${href}`
  await Linking.openURL(url)
}
