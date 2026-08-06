import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enTemplates from '@/locales/en/templates.json'
import siTemplates from '@/locales/si/templates.json'
import enQueue from '@/locales/en/queue.json'
import siQueue from '@/locales/si/queue.json'
import enSend from '@/locales/en/send.json'
import siSend from '@/locales/si/send.json'

export const NAMESPACES = ['shell', 'templates', 'queue', 'send'] as const

export function initEmailI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        templates: enTemplates,
        queue: enQueue,
        send: enSend,
      },
      si: {
        shell: siShell,
        templates: siTemplates,
        queue: siQueue,
        send: siSend,
      },
    },
  })
}

export { getAppI18n }
