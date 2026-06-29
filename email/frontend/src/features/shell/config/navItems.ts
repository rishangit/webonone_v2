import {
  History,
  LayoutDashboard,
  Mail,
  MailCheck,
  Rows3,
  Send,
  Server,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'
import type { EmailRole } from '@/features/auth/types/auth.types'

export type EmailNavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: EmailRole[]
}

export const emailNavItems: EmailNavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/send', label: 'Send Email', icon: Send, roles: ['super_admin', 'company_admin'] },
  { to: '/templates', label: 'Templates', icon: Mail, roles: ['super_admin', 'company_admin'] },
  { to: '/history', label: 'History', icon: History, roles: ['super_admin', 'company_admin'] },
  { to: '/queue', label: 'Queue', icon: Rows3, roles: ['super_admin', 'company_admin'] },
  { to: '/test', label: 'Test Email', icon: MailCheck, roles: ['super_admin', 'company_admin'] },
  { to: '/providers', label: 'Providers', icon: Server, roles: ['super_admin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'company_admin'] },
]

export function filterNavByRole(role: EmailRole): NavConfigItem[] {
  return emailNavItems
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      type: 'item' as const,
      to: item.to,
      label: item.label,
      icon: item.icon,
    }))
}
