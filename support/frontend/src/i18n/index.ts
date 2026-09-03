import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enHome from '@/locales/en/home.json'
import siHome from '@/locales/si/home.json'
import enDocs from '@/locales/en/docs.json'
import siDocs from '@/locales/si/docs.json'

export const NAMESPACES = ['shell', 'home', 'docs'] as const

export function initSupportI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        home: enHome,
        docs: enDocs,
      },
      si: {
        shell: siShell,
        home: siHome,
        docs: siDocs,
      },
    },
  })
}

export { getAppI18n }
