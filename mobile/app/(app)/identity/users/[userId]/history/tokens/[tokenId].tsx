import { useLocalSearchParams } from 'expo-router'
import { HistoryTokenDetailScreen } from '@/features/users/screens/HistoryTokenDetailScreen'

export default function IdentityUserHistoryTokenRoute() {
  const { userId, tokenId } = useLocalSearchParams<{ userId: string; tokenId: string }>()
  if (!userId || !tokenId) return null
  return <HistoryTokenDetailScreen userId={userId} tokenId={tokenId} />
}
