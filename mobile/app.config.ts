import type { ExpoConfig, ConfigContext } from 'expo/config'

/** Expo project @rish_nk/webonone — override with EXPO_PROJECT_ID in mobile/.env */
const EAS_PROJECT_ID =
  process.env.EXPO_PROJECT_ID?.trim() || 'e1a94cff-03df-4cad-9693-4641a5e03273'

function resolveApiBaseUrlEnv(
  apiEnv: string | undefined,
  originEnv: string | undefined,
  localDefault: string,
): string {
  const api = apiEnv?.trim()
  if (api) return api
  const origin = originEnv?.trim()?.replace(/\/+$/, '')
  if (origin) return origin.endsWith('/api/v1') ? origin : `${origin}/api/v1`
  return localDefault
}

/**
 * Expo config for the WebOnOne mobile product app (main platform shell on phones).
 *
 * Full role-filtered nav + native screens; SMS this-device gateway on Android only.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'WebOnOne',
  slug: 'webonone',
  scheme: 'webonone',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.webonone.mobile',
  },
  android: {
    package: 'com.webonone.mobile',
    googleServicesFile: './google-services.json',
    permissions: [
      'android.permission.SEND_SMS',
      'android.permission.READ_PHONE_STATE',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      'android.permission.POST_NOTIFICATIONS',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    '@react-native-google-signin/google-signin',
    [
      'expo-notifications',
      {
        color: '#2563eb',
        defaultChannel: 'webonone-alerts',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    identityApiBaseUrl: process.env.IDENTITY_API_BASE_URL ?? 'http://localhost:4011/api/v1',
    smsApiBaseUrl: process.env.SMS_API_BASE_URL ?? 'http://localhost:4016/api/v1',
    emailApiBaseUrl: resolveApiBaseUrlEnv(
      process.env.EMAIL_API_BASE_URL,
      process.env.EMAIL_ORIGIN,
      'http://localhost:4014/api/v1',
    ),
    dataApiBaseUrl: resolveApiBaseUrlEnv(
      process.env.DATA_API_BASE_URL,
      process.env.DATA_ORIGIN,
      'http://localhost:4015/api/v1',
    ),
    webononeApiBaseUrl: process.env.WEBONONE_API_BASE_URL ?? 'http://localhost:4010/api/v1',
    identityOrigin: process.env.IDENTITY_ORIGIN ?? 'http://localhost:3011',
    emailOrigin: process.env.EMAIL_ORIGIN ?? 'http://localhost:3014',
    dataOrigin: process.env.DATA_ORIGIN ?? 'http://localhost:3015',
    paymentOrigin: process.env.PAYMENT_ORIGIN ?? 'http://localhost:3017',
    mediaOrigin: process.env.MEDIA_ORIGIN ?? 'http://localhost:3013',
    paymentApiBaseUrl: resolveApiBaseUrlEnv(
      process.env.PAYMENT_API_BASE_URL,
      process.env.PAYMENT_ORIGIN,
      'http://localhost:4017/api/v1',
    ),
    mediaApiBaseUrl: resolveApiBaseUrlEnv(
      process.env.MEDIA_API_BASE_URL,
      process.env.MEDIA_ORIGIN,
      'http://localhost:4013/api/v1',
    ),
    designOrigin: process.env.DESIGN_ORIGIN ?? 'http://localhost:3019',
    designApiBaseUrl: resolveApiBaseUrlEnv(
      process.env.DESIGN_API_BASE_URL,
      process.env.DESIGN_ORIGIN,
      'http://localhost:4019/api/v1',
    ),
    webononeOrigin: process.env.WEBONONE_ORIGIN ?? 'http://localhost:3010',
    supportOrigin: process.env.SUPPORT_ORIGIN ?? 'http://localhost:3021',
    aiOrigin: process.env.AI_ORIGIN ?? 'http://localhost:3020',
    aiApiBaseUrl: resolveApiBaseUrlEnv(
      process.env.AI_API_BASE_URL,
      process.env.AI_ORIGIN,
      'http://localhost:4020/api/v1',
    ),
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID ?? '',
    expoProjectId: EAS_PROJECT_ID,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
})
