import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import {
  db,
  type PaymentCompanyRow,
  type PaymentInvoiceLineRow,
  type PaymentInvoiceRow,
  type PaymentPlanRow,
  type PaymentSubscriptionRow,
  type InvoiceStatus,
} from '../models/db.js'
import { formatPeriodLabel, periodsThroughNow, type BillingPeriod } from './billingPeriod.js'
import { logAudit } from './audit.service.js'

function toNumber(value: number | string): number {
  return typeof value === 'string' ? Number(value) : value
}

export function normalizePaymentReference(raw: string): string {
  return raw.trim().toUpperCase()
}

async function nextInvoiceIdentifiers(
  trx: typeof db,
  year: number,
): Promise<{ invoiceNumber: string; paymentReference: string }> {
  const existing = await trx('payment_invoice_sequences').where({ year }).forUpdate().first()
  let next = 1
  if (!existing) {
    await trx('payment_invoice_sequences').insert({ year, last_value: 1 })
  } else {
    next = Number(existing.last_value) + 1
    await trx('payment_invoice_sequences').where({ year }).update({ last_value: next })
  }
  const seq = String(next).padStart(6, '0')
  return {
    invoiceNumber: `SYS-${year}-${seq}`,
    paymentReference: `WO-${year}-${seq}`,
  }
}

async function insertInvoiceForPeriod(
  trx: typeof db,
  input: {
    companyId: string
    subscriptionId: string
    plan: PaymentPlanRow
    period: BillingPeriod
  },
): Promise<string | null> {
  const amountMinor = toNumber(input.plan.amount_minor) || env.systemMonthlyAmountMinor
  const currency = input.plan.currency || 'LKR'
  const issuedAt = new Date()
  const dueAt = new Date(input.period.periodEnd)
  dueAt.setUTCDate(dueAt.getUTCDate() + env.invoiceDueDays)

  const year = input.period.periodStart.getUTCFullYear()
  const { invoiceNumber, paymentReference } = await nextInvoiceIdentifiers(trx, year)
  const invoiceId = nanoid()
  const description = formatPeriodLabel(
    input.period.periodStart,
    input.period.periodEnd,
    env.billingTimezone,
  )

  try {
    await trx('payment_invoices').insert({
      id: invoiceId,
      invoice_number: invoiceNumber,
      payment_reference: paymentReference,
      company_id: input.companyId,
      subscription_id: input.subscriptionId,
      kind: 'system_subscription',
      status: 'issued',
      currency,
      amount_minor: amountMinor,
      period_start: input.period.periodStart,
      period_end: input.period.periodEnd,
      issued_at: issuedAt,
      due_at: dueAt,
      paid_at: null,
      voided_at: null,
      notes: null,
      created_at: trx.fn.now(3),
      updated_at: trx.fn.now(3),
    })
  } catch (err) {
    const code = (err as { code?: string }).code
    // MySQL duplicate unique key — period already invoiced
    if (code === 'ER_DUP_ENTRY') {
      return null
    }
    throw err
  }

  await trx('payment_invoice_lines').insert({
    id: nanoid(),
    invoice_id: invoiceId,
    description,
    quantity: 1,
    unit_amount_minor: amountMinor,
    amount_minor: amountMinor,
    created_at: trx.fn.now(3),
  })

  return invoiceId
}

export async function generateInvoicesForSubscription(subscriptionId: string): Promise<number> {
  const sub = await db<PaymentSubscriptionRow>('payment_subscriptions')
    .where({ id: subscriptionId })
    .first()
  if (!sub || sub.status !== 'active') {
    return 0
  }

  const plan = await db<PaymentPlanRow>('payment_plans').where({ id: sub.plan_id }).first()
  if (!plan) {
    return 0
  }

  const periods = periodsThroughNow(new Date(sub.activated_at), new Date(), env.billingTimezone)
  let created = 0

  for (const period of periods) {
    const createdId = await db.transaction(async (trx) =>
      insertInvoiceForPeriod(trx as unknown as typeof db, {
        companyId: sub.company_id,
        subscriptionId: sub.id,
        plan,
        period,
      }),
    )
    if (createdId) {
      created += 1
      await logAudit({
        action: 'invoice.issued',
        entityType: 'invoice',
        entityId: createdId,
        metadata: {
          companyId: sub.company_id,
          periodStart: period.periodStart.toISOString(),
        },
      })
    }
  }

  return created
}

export async function generateAllDueInvoices(companyId?: string): Promise<{ created: number }> {
  const query = db<PaymentSubscriptionRow>('payment_subscriptions').where({ status: 'active' })
  if (companyId) {
    query.andWhere({ company_id: companyId })
  }
  const subs = await query
  let created = 0
  for (const sub of subs) {
    created += await generateInvoicesForSubscription(sub.id)
  }
  await markOverdueInvoices()
  return { created }
}

export async function markOverdueInvoices(): Promise<number> {
  const updated = await db('payment_invoices')
    .where({ status: 'issued' })
    .andWhere('due_at', '<', db.fn.now(3))
    .update({ status: 'overdue', updated_at: db.fn.now(3) })
  return Number(updated) || 0
}

export type InvoiceListQuery = {
  page: number
  pageSize: number
  status?: InvoiceStatus | 'all'
  companyId?: string | null
  q?: string
  from?: string
  to?: string
}

export type InvoiceListItem = {
  id: string
  invoiceNumber: string
  paymentReference: string
  companyId: string
  companyName: string
  companyLogoUrl: string | null
  kind: 'system_subscription'
  status: InvoiceStatus
  currency: string
  amountMinor: number
  periodStart: string
  periodEnd: string
  issuedAt: string
  dueAt: string
  paidAt: string | null
  receiptMediaId: string | null
  receiptUrl: string | null
  receiptFileName: string | null
  receiptUploadedAt: string | null
}

function mapInvoiceRow(
  row: PaymentInvoiceRow & { company_name?: string; company_logo_url?: string | null },
): InvoiceListItem {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    paymentReference: row.payment_reference,
    companyId: row.company_id,
    companyName: row.company_name ?? '',
    companyLogoUrl: row.company_logo_url ?? null,
    kind: 'system_subscription',
    status: row.status,
    currency: row.currency,
    amountMinor: toNumber(row.amount_minor),
    periodStart: new Date(row.period_start).toISOString(),
    periodEnd: new Date(row.period_end).toISOString(),
    issuedAt: new Date(row.issued_at).toISOString(),
    dueAt: new Date(row.due_at).toISOString(),
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    receiptMediaId: row.receipt_media_id ?? null,
    receiptUrl: row.receipt_url ?? null,
    receiptFileName: row.receipt_file_name ?? null,
    receiptUploadedAt: row.receipt_uploaded_at
      ? new Date(row.receipt_uploaded_at).toISOString()
      : null,
  }
}

export async function listInvoices(query: InvoiceListQuery) {
  const page = Math.max(1, query.page)
  const pageSize = Math.min(100, Math.max(1, query.pageSize))
  const offset = (page - 1) * pageSize

  const base = db('payment_invoices as i')
    .leftJoin('payment_companies as c', 'c.id', 'i.company_id')
    .modify((qb) => {
      if (query.status && query.status !== 'all') {
        qb.andWhere('i.status', query.status)
      }
      if (query.companyId) {
        qb.andWhere('i.company_id', query.companyId)
      }
      if (query.q?.trim()) {
        const q = `%${query.q.trim()}%`
        qb.andWhere((inner) => {
          inner
            .whereILike('c.name', q)
            .orWhereILike('i.invoice_number', q)
            .orWhereILike('i.payment_reference', q)
        })
      }
      if (query.from) {
        qb.andWhere('i.period_start', '>=', new Date(query.from))
      }
      if (query.to) {
        qb.andWhere('i.period_start', '<=', new Date(query.to))
      }
    })

  const countRow = await base.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)

  const rows = await base
    .clone()
    .select(
      'i.*',
      db.raw('c.name as company_name'),
      db.raw('c.logo_url as company_logo_url'),
    )
    .orderBy('i.period_start', 'desc')
    .orderBy('i.created_at', 'desc')
    .limit(pageSize)
    .offset(offset)

  return {
    items: (rows as Array<PaymentInvoiceRow & { company_name: string }>).map(mapInvoiceRow),
    total,
    page,
    pageSize,
  }
}

export async function getInvoiceById(id: string) {
  const row = await db('payment_invoices as i')
    .leftJoin('payment_companies as c', 'c.id', 'i.company_id')
    .where('i.id', id)
    .select(
      'i.*',
      db.raw('c.name as company_name'),
      db.raw('c.logo_url as company_logo_url'),
    )
    .first()

  if (!row) {
    return null
  }

  const lines = await db<PaymentInvoiceLineRow>('payment_invoice_lines')
    .where({ invoice_id: id })
    .orderBy('created_at', 'asc')

  return {
    ...mapInvoiceRow(row as PaymentInvoiceRow & { company_name: string }),
    voidedAt: row.voided_at ? new Date(row.voided_at).toISOString() : null,
    notes: row.notes,
    lines: lines.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unitAmountMinor: toNumber(line.unit_amount_minor),
      amountMinor: toNumber(line.amount_minor),
    })),
  }
}

export async function getInvoiceByPaymentReference(reference: string) {
  const normalized = normalizePaymentReference(reference)
  if (!normalized) {
    return null
  }

  const row = await db('payment_invoices as i')
    .leftJoin('payment_companies as c', 'c.id', 'i.company_id')
    .whereRaw('UPPER(i.payment_reference) = ?', [normalized])
    .select('i.*', db.raw('c.name as company_name'))
    .first()

  if (!row) {
    return null
  }

  return getInvoiceById(row.id as string)
}

export async function markInvoicePaidByReference(
  reference: string,
  paidAt?: string | null,
  actorId?: string,
) {
  const invoice = await getInvoiceByPaymentReference(reference)
  if (!invoice) {
    return null
  }
  return markInvoicePaid(invoice.id, paidAt, actorId)
}

export async function markInvoicePaid(id: string, paidAt?: string | null, actorId?: string) {
  const invoice = await db<PaymentInvoiceRow>('payment_invoices').where({ id }).first()
  if (!invoice) {
    return null
  }
  if (invoice.status === 'void') {
    throw Object.assign(new Error('Cannot mark a void invoice as paid'), { statusCode: 400 })
  }
  if (invoice.status === 'paid') {
    return getInvoiceById(id)
  }

  await db('payment_invoices').where({ id }).update({
    status: 'paid',
    paid_at: paidAt ? new Date(paidAt) : db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  await logAudit({
    userId: actorId,
    action: 'invoice.paid',
    entityType: 'invoice',
    entityId: id,
  })
  return getInvoiceById(id)
}

export async function submitPaymentProof(
  id: string,
  input: { mediaId: string; url: string; fileName?: string | null },
  actorId?: string,
) {
  const invoice = await db<PaymentInvoiceRow>('payment_invoices').where({ id }).first()
  if (!invoice) {
    return null
  }
  if (invoice.status !== 'issued' && invoice.status !== 'overdue') {
    throw Object.assign(
      new Error('Only issued or overdue invoices can submit a payment proof'),
      { statusCode: 400 },
    )
  }

  await db('payment_invoices').where({ id }).update({
    status: 'pending_verification',
    receipt_media_id: input.mediaId,
    receipt_url: input.url,
    receipt_file_name: input.fileName?.trim() || null,
    receipt_uploaded_at: db.fn.now(3),
    receipt_uploaded_by: actorId ?? null,
    updated_at: db.fn.now(3),
  })
  await logAudit({
    userId: actorId,
    action: 'invoice.payment_proof_submitted',
    entityType: 'invoice',
    entityId: id,
    metadata: { mediaId: input.mediaId },
  })
  return getInvoiceById(id)
}

export async function rejectPaymentProof(id: string, actorId?: string) {
  const invoice = await db<PaymentInvoiceRow>('payment_invoices').where({ id }).first()
  if (!invoice) {
    return null
  }
  if (invoice.status !== 'pending_verification') {
    throw Object.assign(new Error('Invoice is not pending verification'), { statusCode: 400 })
  }

  const nextStatus: InvoiceStatus =
    new Date(invoice.due_at).getTime() < Date.now() ? 'overdue' : 'issued'

  await db('payment_invoices').where({ id }).update({
    status: nextStatus,
    receipt_media_id: null,
    receipt_url: null,
    receipt_file_name: null,
    receipt_uploaded_at: null,
    receipt_uploaded_by: null,
    updated_at: db.fn.now(3),
  })
  await logAudit({
    userId: actorId,
    action: 'invoice.payment_proof_rejected',
    entityType: 'invoice',
    entityId: id,
    metadata: { restoredStatus: nextStatus },
  })
  return getInvoiceById(id)
}

export async function voidInvoice(id: string, reason?: string, actorId?: string) {
  const invoice = await db<PaymentInvoiceRow>('payment_invoices').where({ id }).first()
  if (!invoice) {
    return null
  }
  if (invoice.status === 'paid') {
    throw Object.assign(new Error('Cannot void a paid invoice'), { statusCode: 400 })
  }
  if (invoice.status === 'void') {
    return getInvoiceById(id)
  }

  await db('payment_invoices').where({ id }).update({
    status: 'void',
    voided_at: db.fn.now(3),
    notes: reason ?? invoice.notes,
    updated_at: db.fn.now(3),
  })
  await logAudit({
    userId: actorId,
    action: 'invoice.voided',
    entityType: 'invoice',
    entityId: id,
    metadata: { reason },
  })
  return getInvoiceById(id)
}

export async function getDashboardSummary(companyId?: string | null) {
  const base = db('payment_invoices').modify((qb) => {
    if (companyId) {
      qb.where({ company_id: companyId })
    }
  })

  const [issued, paid, overdue, voided, pendingVerification] = await Promise.all([
    base.clone().where({ status: 'issued' }).count<{ count: number | string }[]>({ count: '*' }).first(),
    base.clone().where({ status: 'paid' }).count<{ count: number | string }[]>({ count: '*' }).first(),
    base.clone().where({ status: 'overdue' }).count<{ count: number | string }[]>({ count: '*' }).first(),
    base.clone().where({ status: 'void' }).count<{ count: number | string }[]>({ count: '*' }).first(),
    base
      .clone()
      .where({ status: 'pending_verification' })
      .count<{ count: number | string }[]>({ count: '*' })
      .first(),
  ])

  const outstanding = await base
    .clone()
    .whereIn('status', ['issued', 'overdue', 'pending_verification'])
    .sum<{ sum: number | string | null }[]>({ sum: 'amount_minor' })
    .first()

  const companies = await db<PaymentCompanyRow>('payment_companies')
    .where({ status: 'active' })
    .count<{ count: number | string }[]>({ count: '*' })
    .first()

  return {
    issuedCount: Number(issued?.count ?? 0),
    paidCount: Number(paid?.count ?? 0),
    overdueCount: Number(overdue?.count ?? 0),
    voidCount: Number(voided?.count ?? 0),
    pendingVerificationCount: Number(pendingVerification?.count ?? 0),
    outstandingAmountMinor: Number(outstanding?.sum ?? 0),
    activeCompaniesCount: Number(companies?.count ?? 0),
  }
}
