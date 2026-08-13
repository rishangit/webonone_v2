import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enTemplates from '@/locales/en/templates.json'
import siTemplates from '@/locales/si/templates.json'
import enQueue from '@/locales/en/queue.json'
import siQueue from '@/locales/si/queue.json'
import enDevices from '@/locales/en/devices.json'
import siDevices from '@/locales/si/devices.json'
import enSend from '@/locales/en/send.json'
import siSend from '@/locales/si/send.json'
import enGateway from '@/locales/en/gateway.json'
import siGateway from '@/locales/si/gateway.json'

export const NAMESPACES = ['shell', 'templates', 'queue', 'devices', 'send', 'gateway'] as const

export function initSmsI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        templates: enTemplates,
        queue: enQueue,
        devices: enDevices,
        send: enSend,
        gateway: enGateway,
      },
      si: {
        shell: siShell,
        templates: siTemplates,
        queue: siQueue,
        devices: siDevices,
        send: siSend,
        gateway: siGateway,
      },
    },
  })
}

export { getAppI18n }
