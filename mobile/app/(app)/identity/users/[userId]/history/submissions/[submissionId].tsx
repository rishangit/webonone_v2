import { useLocalSearchParams } from 'expo-router'
import { HistorySubmissionDetailScreen } from '@/features/users/screens/HistorySubmissionDetailScreen'

export default function IdentityUserHistorySubmissionRoute() {
  const { userId, submissionId } = useLocalSearchParams<{ userId: string; submissionId: string }>()
  if (!userId || !submissionId) return null
  return <HistorySubmissionDetailScreen userId={userId} submissionId={submissionId} />
}
