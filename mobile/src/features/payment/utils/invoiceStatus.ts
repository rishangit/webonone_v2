import type { StatusTagVariant } from '@webonone/mobile-ui'
import type { InvoiceStatus } from '@/features/payment/types/payment.types'

export function invoiceStatusVariant(status: InvoiceStatus): StatusTagVariant {
  if (status === 'paid') return 'approved'
  if (status === 'overdue' || status === 'void') return 'rejected'
  return 'pending'
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'issued':
      return 'Issued'
    case 'paid':
      return 'Paid'
    case 'overdue':
      return 'Overdue'
    case 'void':
      return 'Void'
    case 'pending_verification':
      return 'Pending review'
    default:
      return status
  }
}
