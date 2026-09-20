import { CatalogDetailScreen } from '@/features/data/screens/CatalogDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function DataServiceDetailRoute() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>()
  return <CatalogDetailScreen kind="services" itemId={serviceId} />
}
