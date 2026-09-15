import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enHome from '@/locales/en/home.json'
import siHome from '@/locales/si/home.json'
import enDocs from '@/locales/en/docs.json'
import siDocs from '@/locales/si/docs.json'
import enFeedback from '@/locales/en/feedback.json'
import siFeedback from '@/locales/si/feedback.json'

export const NAMESPACES = ['shell', 'home', 'docs', 'feedback'] as const

export function initSupportI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        home: enHome,
        docs: enDocs,
        feedback: enFeedback,
      },
      si: {
        shell: siShell,
        home: siHome,
        docs: siDocs,
        feedback: siFeedback,
      },
    },
  })
}

export { getAppI18n }
