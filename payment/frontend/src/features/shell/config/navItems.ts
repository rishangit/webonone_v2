import { FileText, LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'
import type { PaymentRole } from '@/features/auth/types/auth.types'

export type PaymentNavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: PaymentRole[]
}

const TOP_LEVEL_ITEMS: PaymentNavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'company_admin'] },
  { to: '/invoices', label: 'Invoices', icon: FileText, roles: ['super_admin', 'company_admin'] },
]

export function buildStandaloneNav(role: PaymentRole): NavConfigItem[] {
  return TOP_LEVEL_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    type: 'item' as const,
    to: item.to,
    label: item.label,
    icon: item.icon,
  }))
}

export function filterNavByRole(role: PaymentRole): NavConfigItem[] {
  return buildStandaloneNav(role)
}
