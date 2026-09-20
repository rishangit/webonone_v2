import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import type { AppLocale, StickySessionRole } from '@/shared/types'

const ACCESS_TOKEN_KEY = 'webonone.mobile.accessToken'
const DEVICE_KEY_KEY = 'webonone.mobile.deviceKey'
const DEVICE_ID_KEY = 'webonone.mobile.deviceId'
const PUSH_TOKEN_KEY = 'webonone.mobile.pushToken'
const SESSION_ROLE_KEY = 'webonone.mobile.sessionRole'
const LOCALE_KEY = 'webonone.locale'

const LEGACY_KEYS: Record<string, string> = {
  [ACCESS_TOKEN_KEY]: 'webonone.sms.accessToken',
  [DEVICE_KEY_KEY]: 'webonone.sms.deviceKey',
  [DEVICE_ID_KEY]: 'webonone.sms.deviceId',
  [SESSION_ROLE_KEY]: 'webonone.sms.sessionRole',
}

const useSecureStore = Platform.OS !== 'web'

async function getItem(key: string): Promise<string | null> {
  const value = useSecureStore ? await SecureStore.getItemAsync(key) : await AsyncStorage.getItem(key)
  if (value != null) return value
  const legacyKey = LEGACY_KEYS[key]
  if (!legacyKey) return null
  const legacy = useSecureStore
    ? await SecureStore.getItemAsync(legacyKey)
    : await AsyncStorage.getItem(legacyKey)
  if (legacy != null) await setItem(key, legacy)
  return legacy
}

async function setItem(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value)
    return
  }
  await AsyncStorage.setItem(key, value)
}

async function deleteItem(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key)
    return
  }
  await AsyncStorage.removeItem(key)
}

function isSessionRole(value: unknown): value is StickySessionRole['role'] {
  return value === 'super_admin' || value === 'company_admin' || value === 'member'
}

export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    return getItem(ACCESS_TOKEN_KEY)
  },
  async setAccessToken(token: string): Promise<void> {
    await setItem(ACCESS_TOKEN_KEY, token)
  },
  async clearAccessToken(): Promise<void> {
    await deleteItem(ACCESS_TOKEN_KEY)
  },
  async getSessionRole(): Promise<StickySessionRole | null> {
    const raw = await getItem(SESSION_ROLE_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as StickySessionRole
      if (!isSessionRole(parsed.role)) return null
      return parsed
    } catch {
      return null
    }
  },
  async setSessionRole(role: StickySessionRole): Promise<void> {
    await setItem(SESSION_ROLE_KEY, JSON.stringify(role))
  },
  async clearSessionRole(): Promise<void> {
    await deleteItem(SESSION_ROLE_KEY)
  },
  async getLocale(): Promise<AppLocale | null> {
    const raw = await getItem(LOCALE_KEY)
    return raw === 'en' || raw === 'si' ? raw : null
  },
  async setLocale(locale: AppLocale): Promise<void> {
    await setItem(LOCALE_KEY, locale)
  },
  async getDeviceKey(): Promise<string | null> {
    return getItem(DEVICE_KEY_KEY)
  },
  async setDeviceKey(key: string): Promise<void> {
    await setItem(DEVICE_KEY_KEY, key)
  },
  async getDeviceId(): Promise<string | null> {
    return getItem(DEVICE_ID_KEY)
  },
  async setDeviceId(id: string): Promise<void> {
    await setItem(DEVICE_ID_KEY, id)
  },
  async clearDevice(): Promise<void> {
    await deleteItem(DEVICE_KEY_KEY)
    await deleteItem(DEVICE_ID_KEY)
  },
  async getPushToken(): Promise<string | null> {
    return getItem(PUSH_TOKEN_KEY)
  },
  async setPushToken(token: string): Promise<void> {
    await setItem(PUSH_TOKEN_KEY, token)
  },
  async clearPushToken(): Promise<void> {
    await deleteItem(PUSH_TOKEN_KEY)
  },
}
