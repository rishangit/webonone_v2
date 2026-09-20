import { UnitDetailScreen } from '@/features/data/screens/UnitDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function DataUnitDetailRoute() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>()
  return <UnitDetailScreen unitId={unitId} />
}
