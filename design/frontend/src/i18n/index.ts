import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enForms from '@/locales/en/forms.json'
import siForms from '@/locales/si/forms.json'

import enWebsite from '@/locales/en/website.json'
import siWebsite from '@/locales/si/website.json'

export const NAMESPACES = ['shell', 'forms', 'website'] as const

export function initDesignI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        forms: enForms,
        website: enWebsite,
      },
      si: {
        shell: siShell,
        forms: siForms,
        website: siWebsite,
      },
    },
  })
}

export { getAppI18n }
