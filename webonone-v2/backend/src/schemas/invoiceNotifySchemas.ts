import { z } from 'zod'

export const invoiceIssuedNotifyBodySchema = z.object({
  companyId: z.string().min(1),
  invoiceId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  paymentReference: z.string().min(1),
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().min(1).max(8),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  dueAt: z.string().datetime(),
  issuedAt: z.string().datetime(),
  billingPeriod: z.string().min(1),
  invoicesUrl: z.string().url(),
})

export type InvoiceIssuedNotifyBody = z.infer<typeof invoiceIssuedNotifyBodySchema>
