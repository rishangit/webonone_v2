import type { LucideIcon } from 'lucide-react'

export type NavItemConfig = {
  to: string
  label: string
  icon: LucideIcon
}

export type NavConfigItem =
  | { type: 'item'; to: string; label: string; icon: LucideIcon }
  | { type: 'group'; label: string; icon: LucideIcon; children: NavItemConfig[] }
