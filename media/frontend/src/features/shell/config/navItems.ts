import { FolderOpen, LayoutGrid } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'

export const mainNav: NavConfigItem[] = [
  { type: 'item', to: '/library', label: 'Library', icon: FolderOpen },
  { type: 'item', to: '/components', label: 'Components', icon: LayoutGrid },
]
