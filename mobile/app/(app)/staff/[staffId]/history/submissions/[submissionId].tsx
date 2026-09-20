import { useLocalSearchParams } from 'expo-router'
import { StaffHistorySubmissionDetailScreen } from '@/features/staff/screens/StaffHistorySubmissionDetailScreen'

export default function StaffHistorySubmissionDetailRoute() {
  const { staffId, submissionId } = useLocalSearchParams<{
    staffId: string
    submissionId: string
  }>()
  if (!staffId || !submissionId) return null
  return <StaffHistorySubmissionDetailScreen staffId={staffId} submissionId={submissionId} />
}
