import { TagDetailScreen } from '@/features/data/screens/TagDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function DataTagDetailRoute() {
  const { tagId } = useLocalSearchParams<{ tagId: string }>()
  return <TagDetailScreen tagId={tagId} />
}
