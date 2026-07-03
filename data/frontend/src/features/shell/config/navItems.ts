import { LayoutDashboard, Layers, Package, Ruler, Shapes, Tag, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'
import type { DataRole } from '@/features/auth/types/auth.types'

export type DataNavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: DataRole[]
}

const STANDALONE_ITEMS: DataNavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/tags', label: 'Tags', icon: Tag, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/units', label: 'Units', icon: Ruler, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/attributes', label: 'Attributes', icon: Shapes, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/products', label: 'Products', icon: Package, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/services', label: 'Services', icon: Wrench, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/spaces', label: 'Spaces', icon: Layers, roles: ['super_admin', 'company_admin', 'member'] },
]

export function buildStandaloneNav(_role: DataRole): NavConfigItem[] {
  return STANDALONE_ITEMS.map((item) => ({
    type: 'item' as const,
    to: item.to,
    label: item.label,
    icon: item.icon,
  }))
}

export function filterNavByRole(role: DataRole): NavConfigItem[] {
  return buildStandaloneNav(role)
}
