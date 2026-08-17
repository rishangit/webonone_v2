import { FileText, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'
import type { DesignRole } from '@/features/auth/types/auth.types'

export type DesignNavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: DesignRole[]
}

const TOP_LEVEL_ITEMS: DesignNavItem[] = [
  {
    to: '/forms',
    label: 'Forms',
    icon: FileText,
    roles: ['super_admin', 'company_admin', 'member'],
  },
  {
    to: '/website',
    label: 'Website',
    icon: Globe,
    roles: ['super_admin', 'company_admin', 'member'],
  },
]

export function buildStandaloneNav(role: DesignRole): NavConfigItem[] {
  return TOP_LEVEL_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    type: 'item' as const,
    to: item.to,
    label: item.label,
    icon: item.icon,
  }))
}

export function filterNavByRole(role: DesignRole): NavConfigItem[] {
  return buildStandaloneNav(role)
}
