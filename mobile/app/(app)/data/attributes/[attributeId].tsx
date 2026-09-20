import { AttributeDetailScreen } from '@/features/data/screens/AttributeDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function DataAttributeDetailRoute() {
  const { attributeId } = useLocalSearchParams<{ attributeId: string }>()
  return <AttributeDetailScreen attributeId={attributeId} />
}
