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
  plugins: ['expo-router', 'expo-secure-store'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    identityApiBaseUrl: process.env.IDENTITY_API_BASE_URL ?? 'http://localhost:4011',
    smsApiBaseUrl: process.env.SMS_API_BASE_URL ?? 'http://localhost:4016',
  },
})
