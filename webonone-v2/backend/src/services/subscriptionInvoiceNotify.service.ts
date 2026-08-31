import { fetchUserContact } from '../clients/identityUserContactClient.js'
import * as companyRepo from '../repositories/company.repository.js'
import type { InvoiceIssuedNotifyBody } from '../schemas/invoiceNotifySchemas.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import { notifySubscriptionInvoiceIssuedInApp } from './inAppNotify.service.js'
import { sendTransactionalSms } from './smsClient.service.js'

const TEMPLATE_SLUG = 'subscription_invoice_issued'

const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

/**
 * Best-effort email + SMS + in-app notification when Payment issues a subscription invoice.
 * Never throws — invoice creation must succeed even if notify fails.
 */
export function notifySubscriptionInvoiceIssued(input: InvoiceIssuedNotifyBody): void {
  void notifySubscriptionInvoiceIssuedAsync(input).catch((err) => {
    console.error('[subscriptionInvoiceNotify] unexpected error:', err)
  })
}

async function notifySubscriptionInvoiceIssuedAsync(
  input: InvoiceIssuedNotifyBody,
): Promise<void> {
  const company = await companyRepo.findCompanyById(input.companyId)
  if (!company?.created_by_user_id) {
    console.info(
      '[subscriptionInvoiceNotify] skipped — company or owner missing',
      input.companyId,
    )
    return
  }

  const ownerUserId = company.created_by_user_id
  const companyName = company.name?.trim() || 'Company'
  const contact = await fetchUserContact(ownerUserId)
  const toEmail = contact?.email?.trim() || company.contact_email?.trim() || null
  const toPhone = contact?.phoneNumber?.trim() || null

  const payload: Record<string, string> = {
    userName: contact?.displayName?.trim() || 'Company owner',
    companyName,
    invoiceNumber: input.invoiceNumber,
    paymentReference: input.paymentReference,
    billingPeriod: input.billingPeriod,
    amount: formatMoney(input.amountMinor, input.currency),
    dueDate: formatDisplayDate(input.dueAt),
    invoicesUrl: input.invoicesUrl,
  }

  if (toEmail) {
    try {
      await sendTransactionalEmail({
        templateSlug: TEMPLATE_SLUG,
        toEmail,
        payload,
        companyId: input.companyId,
        requestedByService: 'webonone',
      })
    } catch (err) {
      console.error('[subscriptionInvoiceNotify] email failed:', err)
    }
  } else {
    console.info('[subscriptionInvoiceNotify] skipped email — no owner email', input.invoiceId)
  }

  if (toPhone) {
    try {
      await sendTransactionalSms({
        toNumber: toPhone,
        templateSlug: TEMPLATE_SLUG,
        payload,
        companyId: input.companyId,
        requestedByService: 'webonone',
      })
    } catch (err) {
      console.error('[subscriptionInvoiceNotify] sms failed:', err)
    }
  } else {
    console.info('[subscriptionInvoiceNotify] skipped sms — no owner phone', input.invoiceId)
  }

  await notifySubscriptionInvoiceIssuedInApp({
    companyId: input.companyId,
    ownerUserId,
    invoiceId: input.invoiceId,
    invoiceNumber: input.invoiceNumber,
    billingPeriod: input.billingPeriod,
    amount: payload.amount,
    dueDate: payload.dueDate,
  })
}

function formatDisplayDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10)
  }
  return date.toLocaleDateString('en-US', DISPLAY_DATE_OPTIONS)
}

function formatMoney(amountMinor: number, currency: string): string {
  const major = amountMinor / 100
  if (currency === 'LKR') {
    return `Rs ${major.toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  return `${currency} ${major.toFixed(2)}`
}
