import {
  Database,
  FileText,
  Globe,
  Image,
  Layers,
  LayoutTemplate,
  Palette,
  Droplets,
  PanelBottom,
  PanelTop,
  Settings,
  Type,
  Text,
  RectangleHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavConfigItem, NavItemConfig } from '@webonone/ui-kit'
import type { DesignRole } from '@/features/auth/types/auth.types'

type WebsiteSectionNav = {
  section: string
  label: string
  icon: LucideIcon
  superAdmin: boolean
}

const WEBSITE_SECTIONS: WebsiteSectionNav[] = [
  { section: 'pages', label: 'Pages', icon: FileText, superAdmin: true },
  { section: 'layouts', label: 'Layouts', icon: LayoutTemplate, superAdmin: true },
  { section: 'headers', label: 'Headers', icon: PanelTop, superAdmin: true },
  { section: 'footers', label: 'Footers', icon: PanelBottom, superAdmin: true },
  { section: 'presets', label: 'Presets', icon: Layers, superAdmin: true },
  { section: 'datasets', label: 'Data Sets', icon: Database, superAdmin: false },
  { section: 'themes', label: 'Themes', icon: Palette, superAdmin: true },
  { section: 'fonts', label: 'Fonts', icon: Type, superAdmin: true },
  { section: 'colors', label: 'Colors', icon: Droplets, superAdmin: true },
  { section: 'texts', label: 'Texts', icon: Text, superAdmin: true },
  { section: 'buttons', label: 'Buttons', icon: RectangleHorizontal, superAdmin: true },
  { section: 'media', label: 'Media', icon: Image, superAdmin: false },
  { section: 'settings', label: 'Settings', icon: Settings, superAdmin: false },
]

function websiteChildren(role: DesignRole): NavItemConfig[] {
  return WEBSITE_SECTIONS.filter((item) => role !== 'super_admin' || item.superAdmin).map((item) => ({
    to: `/website/${item.section}`,
    label: item.label,
    icon: item.icon,
  }))
}

export function buildStandaloneNav(role: DesignRole): NavConfigItem[] {
  const items: NavConfigItem[] = []
  if (role === 'company_admin' || role === 'member') {
    items.push({
      type: 'item',
      to: '/forms',
      label: 'Forms',
      icon: FileText,
    })
  }
  items.push({
    type: 'group',
    label: 'Website',
    icon: Globe,
    children: websiteChildren(role),
  })
  return items
}

export function filterNavByRole(role: DesignRole): NavConfigItem[] {
  return buildStandaloneNav(role)
}
