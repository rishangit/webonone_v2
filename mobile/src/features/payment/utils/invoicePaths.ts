import { PAYMENT_NAV_SENTINELS } from '@webonone/platform-nav'

export const INVOICES_PATH = PAYMENT_NAV_SENTINELS.invoices

export function invoiceDetailPath(invoiceId: string): string {
  return `${INVOICES_PATH}/${invoiceId}`
}
