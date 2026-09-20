import { CatalogDetailScreen } from '@/features/data/screens/CatalogDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function DataSpaceDetailRoute() {
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>()
  return <CatalogDetailScreen kind="spaces" itemId={spaceId} />
}
