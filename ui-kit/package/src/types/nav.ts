import type { LucideIcon } from 'lucide-react'

export type NavItemConfig = {
  to: string
  label: string
  icon: LucideIcon
  onClick?: () => void
}

export type NavConfigItem =
  | { type: 'item'; to: string; label: string; icon: LucideIcon; onClick?: () => void }
  | { type: 'group'; label: string; icon: LucideIcon; children: NavItemConfig[] }
