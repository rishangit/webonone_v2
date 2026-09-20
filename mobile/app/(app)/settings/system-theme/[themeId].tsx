import { ThemeDetailScreen } from '@/features/settings/system-theme/ThemeDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function ThemeDetailRoute() {
  const params = useLocalSearchParams<{ themeId: string }>()
  const themeId = typeof params.themeId === 'string' ? params.themeId : ''
  return <ThemeDetailScreen themeId={themeId} />
}
