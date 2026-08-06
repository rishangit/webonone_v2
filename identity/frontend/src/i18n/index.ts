import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import enAuth from '@/locales/en/auth.json'
import enProfile from '@/locales/en/profile.json'
import enUsers from '@/locales/en/users.json'
import siShell from '@/locales/si/shell.json'
import siAuth from '@/locales/si/auth.json'
import siProfile from '@/locales/si/profile.json'
import siUsers from '@/locales/si/users.json'

export const IDENTITY_NAMESPACES = ['shell', 'auth', 'profile', 'users'] as const

export function initIdentityI18n() {
  return createAppI18n({
    ns: [...IDENTITY_NAMESPACES],
    resources: {
      en: { shell: enShell, auth: enAuth, profile: enProfile, users: enUsers },
      si: { shell: siShell, auth: siAuth, profile: siProfile, users: siUsers },
    },
  })
}

export { getAppI18n }
