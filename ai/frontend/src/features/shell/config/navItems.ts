import { MessageSquare } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'
import type { AiRole } from '@/features/auth/types/auth.types'

export type AiNavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: AiRole[]
}

const TOP_LEVEL_ITEMS: AiNavItem[] = [
  {
    to: '/',
    label: 'Conversations',
    icon: MessageSquare,
    roles: ['super_admin', 'company_admin', 'member'],
  },
]

export function buildStandaloneNav(role: AiRole): NavConfigItem[] {
  return TOP_LEVEL_ITEMS.filter((item) => item.roles.includes(role)).map((item) => ({
    type: 'item' as const,
    to: item.to,
    label: item.label,
    icon: item.icon,
  }))
}

