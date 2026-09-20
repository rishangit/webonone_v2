import { useLocalSearchParams } from 'expo-router'
import { WebsiteThemeEditorScreen } from '@/features/design/website/screens/WebsiteThemeEditorScreen'

export default function DesignWebsiteThemeEditRoute() {
  const { themeId } = useLocalSearchParams<{ themeId: string }>()
  return <WebsiteThemeEditorScreen themeId={String(themeId ?? '')} />
}
