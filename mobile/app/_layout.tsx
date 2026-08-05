import '../global.css'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SessionProvider, useSession } from '@/features/auth/SessionContext'

function AuthGate() {
  const { isAuthenticated, isBootstrapping, needsRoleSelection, isBlocked } = useSession()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isBootstrapping) return

    const segment = segments[0]
    const onLogin = segment === 'login'
    const onSelectRole = segment === 'select-role'
    const inTabs = segment === '(tabs)'

    if (isAuthenticated) {
      if (!inTabs) router.replace('/(tabs)')
      return
    }

    if (needsRoleSelection || isBlocked) {
      if (!onSelectRole) router.replace('/select-role')
      return
    }

    if (inTabs || onSelectRole) {
      router.replace('/login')
      return
    }

    if (!onLogin && segment !== undefined) {
      router.replace('/login')
    }
  }, [isAuthenticated, isBootstrapping, needsRoleSelection, isBlocked, router, segments])

  if (isBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#344CE2" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="auto" />
        <AuthGate />
      </SessionProvider>
    </SafeAreaProvider>
  )
}
