import { useLocalSearchParams } from 'expo-router'
import { WebsiteHubScreen } from '@/features/design/website/screens/WebsiteHubScreen'
import { WEBSITE_SECTIONS, type WebsiteSection } from '@/features/design/utils/designPaths'

function isWebsiteSection(value: string): value is WebsiteSection {
  return (WEBSITE_SECTIONS as readonly string[]).includes(value)
}

export default function DesignWebsiteSectionRoute() {
  const { section } = useLocalSearchParams<{ section: string }>()
  const resolved = isWebsiteSection(String(section ?? '')) ? (section as WebsiteSection) : 'pages'
  return <WebsiteHubScreen section={resolved} />
}
