import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enHome from '@/locales/en/home.json'
import siHome from '@/locales/si/home.json'
import enAuth from '@/locales/en/auth.json'
import siAuth from '@/locales/si/auth.json'
import enSearch from '@/locales/en/search.json'
import siSearch from '@/locales/si/search.json'

export const NAMESPACES = ['shell', 'home', 'auth', 'search'] as const

export function initWebsiteI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        home: enHome,
        auth: enAuth,
        search: enSearch,
      },
      si: {
        shell: siShell,
        home: siHome,
        auth: siAuth,
        search: siSearch,
      },
    },
  })
}

export { getAppI18n }
