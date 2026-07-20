import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo-modules-core'

/**
 * Local Expo Module bridging Android `SmsManager` + `SubscriptionManager`.
 *
 * The native implementation lives in the Android project (added via prebuild).
 * When it is unavailable (iOS, web, or Expo Go), the exported helpers degrade
 * gracefully so the JS bundle still type-checks and runs.
 */

export interface SimSlot {
  slot: number
  subscriptionId: number
  carrier?: string
  number?: string
}

interface SmsSenderNativeModule {
  isSupported(): boolean
  requestSendSmsPermission(): Promise<boolean>
  hasSendSmsPermission(): Promise<boolean>
  getSimSlots(): Promise<SimSlot[]>
  sendSms(toNumber: string, body: string, subscriptionId: number | null): Promise<void>
}

const nativeModule = requireOptionalNativeModule<SmsSenderNativeModule>('SmsSender')

export const isAndroid = Platform.OS === 'android'

/** True only when running on Android with the native module compiled in. */
export function isSmsGatewaySupported(): boolean {
  return isAndroid && nativeModule?.isSupported() === true
}

export async function hasSendSmsPermission(): Promise<boolean> {
  if (!nativeModule) return false
  return nativeModule.hasSendSmsPermission()
}

export async function requestSendSmsPermission(): Promise<boolean> {
  if (!nativeModule) return false
  return nativeModule.requestSendSmsPermission()
}

export async function getSimSlots(): Promise<SimSlot[]> {
  if (!nativeModule) return []
  return nativeModule.getSimSlots()
}

/** Send a single SMS via the chosen SIM (subscriptionId), or the default SIM when null. */
export async function sendSms(
  toNumber: string,
  body: string,
  subscriptionId: number | null,
): Promise<void> {
  if (!nativeModule) {
    throw new Error('SMS sending is only available on Android gateway builds')
  }
  await nativeModule.sendSms(toNumber, body, subscriptionId)
}
