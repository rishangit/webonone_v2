import { Redirect, type Href } from 'expo-router'
import { useSession } from '@/features/auth/SessionContext'

export default function Index() {
  const { isAuthenticated, needsRoleSelection, isBlocked, isBootstrapping } = useSession()
  if (isBootstrapping) return null
  if (isAuthenticated) return <Redirect href={'/(app)' as Href} />
  if (needsRoleSelection || isBlocked) return <Redirect href="/select-role" />
  return <Redirect href="/login" />
}
