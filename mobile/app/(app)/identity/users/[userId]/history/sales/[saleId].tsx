import { useLocalSearchParams } from 'expo-router'
import { HistorySaleDetailScreen } from '@/features/users/screens/HistorySaleDetailScreen'

export default function IdentityUserHistorySaleRoute() {
  const { userId, saleId } = useLocalSearchParams<{ userId: string; saleId: string }>()
  if (!userId || !saleId) return null
  return <HistorySaleDetailScreen userId={userId} saleId={saleId} />
}
