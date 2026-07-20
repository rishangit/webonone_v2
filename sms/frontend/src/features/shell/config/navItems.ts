import {
  History,
  LayoutDashboard,
  MessageSquare,
  Rows3,
  Send,
  Smartphone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'
import type { SmsRole } from '@/features/auth/types/auth.types'

export type SmsNavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: SmsRole[]
}

const SMS_ADMIN_SUB_ITEMS: SmsNavItem[] = [
  { to: '/devices', label: 'Devices', icon: Smartphone, roles: ['super_admin', 'company_admin'] },
  { to: '/queue', label: 'Queue', icon: Rows3, roles: ['super_admin', 'company_admin'] },
  { to: '/history', label: 'History', icon: History, roles: ['super_admin', 'company_admin'] },
  { to: '/templates', label: 'Templates', icon: MessageSquare, roles: ['super_admin', 'company_admin'] },
]

const TOP_LEVEL_ITEMS: SmsNavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'company_admin', 'member'] },
  { to: '/send', label: 'Send SMS', icon: Send, roles: ['super_admin', 'company_admin'] },
]

function isAdmin(role: SmsRole): boolean {
  return role === 'super_admin' || role === 'company_admin'
}

/** Standalone SMS service left nav — role-filtered; admins get an SMS group with device/queue/history/templates. */
export function buildStandaloneNav(role: SmsRole): NavConfigItem[] {
  const items: NavConfigItem[] = []

  for (const item of TOP_LEVEL_ITEMS) {
    if (!item.roles.includes(role)) {
      continue
    }
    items.push({ type: 'item', to: item.to, label: item.label, icon: item.icon })
    if (item.to === '/send' && isAdmin(role)) {
      items.push({
        type: 'group',
        label: 'SMS',
        icon: MessageSquare,
        children: SMS_ADMIN_SUB_ITEMS.filter((sub) => sub.roles.includes(role)).map((sub) => ({
          to: sub.to,
          label: sub.label,
          icon: sub.icon,
        })),
      })
    }
  }

  return items
}
