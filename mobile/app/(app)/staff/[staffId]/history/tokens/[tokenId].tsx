import { useLocalSearchParams } from 'expo-router'
import { StaffHistoryTokenDetailScreen } from '@/features/staff/screens/StaffHistoryTokenDetailScreen'

export default function StaffHistoryTokenDetailRoute() {
  const { staffId, tokenId } = useLocalSearchParams<{ staffId: string; tokenId: string }>()
  if (!staffId || !tokenId) return null
  return <StaffHistoryTokenDetailScreen staffId={staffId} tokenId={tokenId} />
}
