import { Home, Palette, Settings } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'

export const mainNav: NavConfigItem[] = [
  { type: 'item', to: '/', label: 'Home', icon: Home },
  {
    type: 'group',
    label: 'Settings',
    icon: Settings,
    children: [{ to: '/settings/system-theme', label: 'System Theme', icon: Palette }],
  },
]
