import '../global.css'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Slot, useRouter, useSegments, type Href } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ToastProvider } from '@webonone/mobile-ui'
import { I18nextProvider } from 'react-i18next'
import { SessionProvider, useSession } from '@/features/auth/SessionContext'
import { AppThemeProvider, useThemeColors } from '@/features/theme/AppThemeProvider'
import { getAppI18n, initMobileI18n } from '@/i18n'

initMobileI18n()

/** Guest auth routes reachable while signed out (before role selection). */
const GUEST_AUTH_SEGMENTS = new Set([
  'login',
  'register',
  'forgot-password',
  'verify-reset-otp',
  'reset-password',
  'select-role',
])

/** Gates routing until session bootstrap finishes. */
function AuthGate() {
  const { isAuthenticated, isBootstrapping, needsRoleSelection, isBlocked } = useSession()
  const colors = useThemeColors()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isBootstrapping) return

    const segment = segments[0]
    const inApp = segment === '(app)'
    const onGuestAuth = segment !== undefined && GUEST_AUTH_SEGMENTS.has(segment)

    if (isAuthenticated) {
      if (!inApp) router.replace('/(app)' as Href)
      return
    }

    if (needsRoleSelection || isBlocked) {
      if (segment !== 'select-role') router.replace('/select-role')
      return
    }

    if (inApp || segment === 'select-role') {
      router.replace('/login')
      return
    }

    if (segment !== undefined && !onGuestAuth) {
      router.replace('/login')
    }
  }, [isAuthenticated, isBootstrapping, needsRoleSelection, isBlocked, router, segments])

  if (isBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={getAppI18n()}>
      <SafeAreaProvider>
        <SessionProvider>
          <AppThemeProvider>
            <ToastProvider>
              <AuthGate />
            </ToastProvider>
          </AppThemeProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  )
}
