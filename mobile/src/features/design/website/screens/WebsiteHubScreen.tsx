import { WebsiteChromeScreen } from '@/features/design/website/screens/WebsiteChromeScreen'
import { WebsiteDatasetsScreen } from '@/features/design/website/screens/WebsiteDatasetsScreen'
import { WebsiteLayoutsScreen } from '@/features/design/website/screens/WebsiteLayoutsScreen'
import { WebsiteMediaScreen } from '@/features/design/website/screens/WebsiteMediaScreen'
import { WebsitePagesScreen } from '@/features/design/website/screens/WebsitePagesScreen'
import { WebsitePresetsScreen } from '@/features/design/website/screens/WebsitePresetsScreen'
import { WebsiteSettingsScreen } from '@/features/design/website/screens/WebsiteSettingsScreen'
import { WebsiteThemesScreen } from '@/features/design/website/screens/WebsiteThemesScreen'
import type { WebsiteSection } from '@/features/design/utils/designPaths'

export function WebsiteHubScreen({ section }: { section: WebsiteSection }) {
  switch (section) {
    case 'headers':
      return <WebsiteChromeScreen kind="headers" />
    case 'footers':
      return <WebsiteChromeScreen kind="footers" />
    case 'layouts':
      return <WebsiteLayoutsScreen />
    case 'presets':
      return <WebsitePresetsScreen />
    case 'datasets':
      return <WebsiteDatasetsScreen />
    case 'themes':
      return <WebsiteThemesScreen />
    case 'media':
      return <WebsiteMediaScreen />
    case 'settings':
      return <WebsiteSettingsScreen />
    default:
      return <WebsitePagesScreen />
  }
}
