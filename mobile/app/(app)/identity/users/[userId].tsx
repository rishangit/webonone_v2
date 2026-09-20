import { useLocalSearchParams } from 'expo-router'
import { UserDetailScreen } from '@/features/users/screens/UserDetailScreen'

export default function IdentityUserDetailRoute() {
  const { userId, tab } = useLocalSearchParams<{ userId: string; tab?: string }>()
  if (!userId) return null
  return (
    <UserDetailScreen
      userId={userId}
      initialTab={tab === 'history' ? 'history' : 'overview'}
    />
  )
}
