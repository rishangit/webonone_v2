import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enChat from '@/locales/en/chat.json'
import siChat from '@/locales/si/chat.json'

export const NAMESPACES = ['shell', 'chat'] as const

export function initAiI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        chat: enChat,
      },
      si: {
        shell: siShell,
        chat: siChat,
      },
    },
  })
}

export { getAppI18n }
