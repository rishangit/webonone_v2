import Constants from 'expo-constants'

interface MobileEnv {
  identityApiBaseUrl: string
  smsApiBaseUrl: string
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<MobileEnv>

export const env: MobileEnv = {
  identityApiBaseUrl: extra.identityApiBaseUrl ?? 'http://localhost:4011',
  smsApiBaseUrl: extra.smsApiBaseUrl ?? 'http://localhost:4016',
}
