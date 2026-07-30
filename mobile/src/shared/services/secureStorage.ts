import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import type { StickySessionRole } from '@/shared/types'

const ACCESS_TOKEN_KEY = 'webonone.sms.accessToken'
const DEVICE_KEY_KEY = 'webonone.sms.deviceKey'
const DEVICE_ID_KEY = 'webonone.sms.deviceId'
const SESSION_ROLE_KEY = 'webonone.sms.sessionRole'

const useSecureStore = Platform.OS !== 'web'

async function getItem(key: string): Promise<string | null> {
  if (useSecureStore) return SecureStore.getItemAsync(key)
  return AsyncStorage.getItem(key)
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
      if (parsed.role !== 'super_admin' && parsed.role !== 'company_admin') return null
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
}
