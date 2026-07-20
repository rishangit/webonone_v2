import '../global.css'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SessionProvider, useSession } from '@/features/auth/SessionContext'

function AuthGate() {
  const { isAuthenticated, isBootstrapping } = useSession()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isBootstrapping) return
    const inAuthGroup = segments[0] === '(tabs)'

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login')
    } else if (isAuthenticated && !inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isBootstrapping, router, segments])

  if (isBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#2563EB" />
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
