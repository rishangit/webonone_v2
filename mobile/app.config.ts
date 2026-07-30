import type { ExpoConfig, ConfigContext } from 'expo/config'

/**
 * Expo config for the WebOnOne mobile gateway app.
 *
 * v1 scope: login + SMS gateway configuration. Android declares SEND_SMS and
 * runs a foreground service; iOS logs in but shows an Android-only gateway state.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'WebOnOne SMS',
  slug: 'webonone-sms',
  scheme: 'webonone-sms',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.webonone.sms',
  },
  android: {
    package: 'com.webonone.sms',
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
  plugins: ['expo-router', 'expo-secure-store', '@react-native-google-signin/google-signin'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    identityApiBaseUrl: process.env.IDENTITY_API_BASE_URL ?? 'http://localhost:4011/api/v1',
    smsApiBaseUrl: process.env.SMS_API_BASE_URL ?? 'http://localhost:4016/api/v1',
    webononeApiBaseUrl: process.env.WEBONONE_API_BASE_URL ?? 'http://localhost:4010/api/v1',
    /** Same Web OAuth client ID as Identity `VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_ID`. */
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID ?? '',
  },
})
