import { Redirect } from 'expo-router'
import { useSession } from '@/features/auth/SessionContext'

export default function Index() {
  const { isAuthenticated } = useSession()
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />
}
