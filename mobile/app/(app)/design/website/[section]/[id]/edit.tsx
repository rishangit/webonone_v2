import { useLocalSearchParams } from 'expo-router'
import { WebsiteDesignerScreen } from '@/features/design/website/screens/WebsiteDesignerScreen'
import { WebsiteThemeEditorScreen } from '@/features/design/website/screens/WebsiteThemeEditorScreen'
import type { WebsiteDesignerKind } from '@/features/design/website/types'

const KINDS: WebsiteDesignerKind[] = ['pages', 'headers', 'footers', 'presets']

function isDesignerKind(value: string): value is WebsiteDesignerKind {
  return KINDS.includes(value as WebsiteDesignerKind)
}

export default function DesignWebsiteDesignerRoute() {
  const { section, id } = useLocalSearchParams<{ section: string; id: string }>()
  const kind = String(section ?? '')
  const entityId = String(id ?? '')
  if (kind === 'themes') {
    return <WebsiteThemeEditorScreen themeId={entityId} />
  }
  const resolvedKind = isDesignerKind(kind) ? kind : 'pages'
  return <WebsiteDesignerScreen kind={resolvedKind} id={entityId} />
}
