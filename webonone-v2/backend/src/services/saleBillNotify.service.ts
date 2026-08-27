import * as companyRepo from '../repositories/company.repository.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import type { SaleDto, SaleLineDto } from './companySale.service.js'

const TEMPLATE_SLUG = 'sale_bill_completed'

const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  other: 'Other',
}

/**
 * Best-effort email after a POS sale is completed.
 * Never throws — sale completion must succeed even if notify fails.
 */
export function notifySaleBillCompleted(sale: SaleDto): void {
  void notifySaleBillCompletedAsync(sale).catch((err) => {
    console.error('[saleBillNotify] unexpected error:', err)
  })
}

async function notifySaleBillCompletedAsync(sale: SaleDto): Promise<void> {
  const toEmail = sale.customerEmail?.trim() || null
  if (!toEmail) {
    console.info('[saleBillNotify] skipped — no customer email on sale', sale.id)
    return
  }

  if (sale.status !== 'completed' || !sale.billNumber) {
    return
  }

  const company = await companyRepo.findCompanyById(sale.companyId)
  const companyName = company?.name?.trim() || 'Company'

  const { linesHtml, linesText } = buildLineItems(sale.lines, sale.currency)
  const notesBlock = buildNotesHtml(sale.notes)
  const notesText = buildNotesText(sale.notes)

  const payload: Record<string, string> = {
    userName: sale.customerDisplayName?.trim() || 'Customer',
    companyName,
    billNumber: sale.billNumber,
    billDate: formatDisplayDate(sale.createdAt),
    paymentMethod: formatPaymentMethod(sale.paymentMethod),
    totalAmount: formatMoney(sale.total, sale.currency),
    linesHtml,
    linesText,
    notes: notesBlock,
    notesText,
  }

  await sendTransactionalEmail({
    templateSlug: TEMPLATE_SLUG,
    toEmail,
    payload,
    companyId: sale.companyId,
    requestedByService: 'webonone',
  })
}

function formatDisplayDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10)
  }
  return date.toLocaleDateString('en-US', DISPLAY_DATE_OPTIONS)
}

function formatPaymentMethod(method: string | null): string {
  if (!method) return '—'
  return PAYMENT_METHOD_LABELS[method] ?? method
}

function formatMoney(value: number, currency: string): string {
  return `${currency} ${value.toFixed(2)}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function lineDisplayName(line: SaleLineDto): string {
  const name = line.name.trim()
  const variant = line.variantName?.trim()
  return variant ? `${name} (${variant})` : name
}

function buildLineItems(
  lines: SaleLineDto[],
  currency: string,
): { linesHtml: string; linesText: string } {
  if (lines.length === 0) {
    return { linesHtml: '', linesText: '' }
  }

  const rows = lines
    .map((line) => {
      const name = escapeHtml(lineDisplayName(line))
      const qty = String(line.quantity)
      const unit = escapeHtml(formatMoney(line.unitPrice, currency))
      const total = escapeHtml(formatMoney(line.lineTotal, currency))
      return `<tr>
  <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${name}</td>
  <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${qty}</td>
  <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${unit}</td>
  <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${total}</td>
</tr>`
    })
    .join('\n')

  const linesHtml = `<table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
<thead>
  <tr>
    <th style="padding: 6px 8px; text-align: left; border-bottom: 2px solid #d1d5db;">Item</th>
    <th style="padding: 6px 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Qty</th>
    <th style="padding: 6px 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Unit</th>
    <th style="padding: 6px 8px; text-align: right; border-bottom: 2px solid #d1d5db;">Total</th>
  </tr>
</thead>
<tbody>
${rows}
</tbody>
</table>`

  const linesText = lines
    .map((line) => {
      const name = lineDisplayName(line)
      return `- ${name}  x${line.quantity}  @ ${formatMoney(line.unitPrice, currency)}  = ${formatMoney(line.lineTotal, currency)}`
    })
    .join('\n')

  return { linesHtml, linesText }
}

function buildNotesHtml(notes: string | null): string {
  const trimmed = notes?.trim()
  if (!trimmed) return ''
  return `<p>Notes: ${escapeHtml(trimmed)}</p>`
}

function buildNotesText(notes: string | null): string {
  const trimmed = notes?.trim()
  if (!trimmed) return ''
  return `Notes: ${trimmed}`
}
