import { useLocalSearchParams } from 'expo-router'
import { StaffDetailScreen } from '@/features/staff/screens/StaffDetailScreen'
import type { StaffDetailTab } from '@/features/staff/utils/staffPaths'

function parseStaffTab(tab?: string): StaffDetailTab {
  if (tab === 'history' || tab === 'leaves') return tab
  return 'overview'
}

export default function StaffDetailRoute() {
  const { staffId, tab } = useLocalSearchParams<{ staffId: string; tab?: string }>()
  if (!staffId) return null
  return <StaffDetailScreen staffId={staffId} initialTab={parseStaffTab(tab)} />
}