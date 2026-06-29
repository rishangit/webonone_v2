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

const EMAIL_ADMIN_SUB_ITEMS: EmailNavItem[] = [
  { to: '/history', label: 'Email History', icon: History, roles: ['super_admin', 'company_admin'] },
  { to: '/templates', label: 'Templates', icon: Mail, roles: ['super_admin', 'company_admin'] },
]

const STANDALONE_TOP_LEVEL_ITEMS: EmailNavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/send', label: 'Send Email', icon: Send, roles: ['super_admin', 'company_admin'] },
  { to: '/queue', label: 'Queue', icon: Rows3, roles: ['super_admin', 'company_admin'] },
  { to: '/test', label: 'Test Email', icon: MailCheck, roles: ['super_admin', 'company_admin'] },
  { to: '/providers', label: 'Providers', icon: Server, roles: ['super_admin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'company_admin'] },
]

function isAdmin(role: EmailRole): boolean {
  return role === 'super_admin' || role === 'company_admin'
}

/** Standalone Email service left nav — role-filtered; admins get Email → History + Templates group. */
export function buildStandaloneNav(role: EmailRole): NavConfigItem[] {
  const items: NavConfigItem[] = []

  for (const item of STANDALONE_TOP_LEVEL_ITEMS) {
    if (!item.roles.includes(role)) {
      continue
    }
    if (item.to === '/send') {
      items.push({ type: 'item', to: item.to, label: item.label, icon: item.icon })
      if (isAdmin(role)) {
        items.push({
          type: 'group',
          label: 'Email',
          icon: Mail,
          children: EMAIL_ADMIN_SUB_ITEMS.filter((sub) => sub.roles.includes(role)).map((sub) => ({
            to: sub.to,
            label: sub.label,
            icon: sub.icon,
          })),
        })
      }
      continue
    }
    items.push({ type: 'item', to: item.to, label: item.label, icon: item.icon })
  }

  return items
}

export function filterNavByRole(role: EmailRole): NavConfigItem[] {
  return buildStandaloneNav(role)
}
