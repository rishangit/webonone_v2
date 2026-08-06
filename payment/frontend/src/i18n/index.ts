import { createAppI18n, getAppI18n } from '@webonone/i18n'
import enShell from '@/locales/en/shell.json'
import siShell from '@/locales/si/shell.json'
import enInvoices from '@/locales/en/invoices.json'
import siInvoices from '@/locales/si/invoices.json'

export const NAMESPACES = ['shell', 'invoices'] as const

export function initPaymentI18n() {
  return createAppI18n({
    ns: [...NAMESPACES],
    resources: {
      en: {
        shell: enShell,
        invoices: enInvoices,
      },
      si: {
        shell: siShell,
        invoices: siInvoices,
      },
    },
  })
}

export { getAppI18n }
