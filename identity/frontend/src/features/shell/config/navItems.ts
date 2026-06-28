import { ArrowLeft, KeyRound, User, UserPlus } from 'lucide-react'
import type { NavConfigItem } from '@webonone/ui-kit'

export const IDENTITY_SHELL_ROUTES = ['/profile', '/register', '/reset-password'] as const

export const standaloneNav: NavConfigItem[] = [
  { type: 'item', to: '/profile', label: 'Profile', icon: User },
  { type: 'item', to: '/register', label: 'User register', icon: UserPlus },
  { type: 'item', to: '/reset-password', label: 'Reset password', icon: KeyRound },
]

export function buildIdentityNav(returnUrl?: string | null): NavConfigItem[] {
  if (!returnUrl) {
    return standaloneNav
  }

  return [
    { type: 'item', to: returnUrl, label: 'WebOnOne', icon: ArrowLeft },
    ...standaloneNav,
  ]
}

export function isIdentityShellRoute(pathname: string): boolean {
  return (IDENTITY_SHELL_ROUTES as readonly string[]).includes(pathname)
}
