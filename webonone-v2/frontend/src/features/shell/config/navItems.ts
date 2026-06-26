import { Building2, Home, Palette, Settings } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'

export const mainNav: NavConfigItem[] = [
  { type: 'item', to: '/', label: 'Home', icon: Home },
  {
    type: 'group',
    label: 'Settings',
    icon: Settings,
    children: [
      { to: '/settings/basic', label: 'Basic Settings', icon: Building2 },
      { to: '/settings/system-theme', label: 'System Theme', icon: Palette },
    ],
  },
]
