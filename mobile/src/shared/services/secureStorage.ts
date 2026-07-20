import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const ACCESS_TOKEN_KEY = 'webonone.sms.accessToken'
const DEVICE_KEY_KEY = 'webonone.sms.deviceKey'
const DEVICE_ID_KEY = 'webonone.sms.deviceId'

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
