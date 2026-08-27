import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  db,
  PLATFORM_MONTHLY_PLAN_SLUG,
  type PaymentCompanyRow,
  type PaymentPlanRow,
  type PaymentSubscriptionRow,
} from '../models/db.js'
import { logAudit } from './audit.service.js'
import { generateInvoicesForSubscription } from './invoice.service.js'

export const upsertCompanySchema = z.object({
  companyId: z.string().min(1).max(21),
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.union([z.string().url().max(2048), z.null()]).optional(),
  activatedAt: z.string().datetime().optional().nullable(),
  status: z.enum(['active', 'inactive']),
})

export type UpsertCompanyBody = z.infer<typeof upsertCompanySchema>

async function getPlatformPlan(): Promise<PaymentPlanRow> {
  const plan = await db<PaymentPlanRow>('payment_plans')
    .where({ slug: PLATFORM_MONTHLY_PLAN_SLUG, active: true })
    .first()
  if (!plan) {
    throw new Error('Platform monthly plan is not seeded')
  }
  return plan
}

export async function upsertCompany(body: UpsertCompanyBody) {
  const now = new Date()
  const existing = await db<PaymentCompanyRow>('payment_companies').where({ id: body.companyId }).first()

  const activatedAt =
    body.status === 'active'
      ? body.activatedAt
        ? new Date(body.activatedAt)
        : existing?.activated_at
          ? new Date(existing.activated_at)
          : now
      : existing?.activated_at
        ? new Date(existing.activated_at)
        : null

  const name = body.name?.trim() || existing?.name || 'Company'
  const logoUrl =
    body.logoUrl !== undefined ? body.logoUrl : existing?.logo_url ?? null

  if (existing) {
    await db('payment_companies').where({ id: body.companyId }).update({
      name,
      logo_url: logoUrl,
      status: body.status,
      activated_at: activatedAt,
      updated_at: db.fn.now(3),
    })
  } else {
    await db('payment_companies').insert({
      id: body.companyId,
      name,
      logo_url: logoUrl,
      status: body.status,
      activated_at: activatedAt,
      created_at: db.fn.now(3),
      updated_at: db.fn.now(3),
    })
  }

  const plan = await getPlatformPlan()

  if (body.status === 'active') {
    if (!activatedAt) {
      throw Object.assign(new Error('activatedAt is required when status is active'), { statusCode: 400 })
    }

    const activeSub = await db<PaymentSubscriptionRow>('payment_subscriptions')
      .where({ company_id: body.companyId, status: 'active' })
      .first()

    if (activeSub) {
      await db('payment_subscriptions').where({ id: activeSub.id }).update({
        activated_at: activatedAt,
        plan_id: plan.id,
        updated_at: db.fn.now(3),
      })
      await logAudit({
        action: 'subscription.updated',
        entityType: 'subscription',
        entityId: activeSub.id,
        metadata: { companyId: body.companyId, activatedAt: activatedAt.toISOString() },
      })
      await generateInvoicesForSubscription(activeSub.id)
    } else {
      const subId = nanoid()
      await db('payment_subscriptions').insert({
        id: subId,
        company_id: body.companyId,
        plan_id: plan.id,
        activated_at: activatedAt,
        status: 'active',
        cancelled_at: null,
        created_at: db.fn.now(3),
        updated_at: db.fn.now(3),
      })
      await logAudit({
        action: 'subscription.activated',
        entityType: 'subscription',
        entityId: subId,
        metadata: { companyId: body.companyId, activatedAt: activatedAt.toISOString() },
      })
      await generateInvoicesForSubscription(subId)
    }
  } else {
    await db('payment_subscriptions')
      .where({ company_id: body.companyId, status: 'active' })
      .update({
        status: 'cancelled',
        cancelled_at: db.fn.now(3),
        updated_at: db.fn.now(3),
      })
    await logAudit({
      action: 'subscription.cancelled',
      entityType: 'company',
      entityId: body.companyId,
    })
  }

  return db<PaymentCompanyRow>('payment_companies').where({ id: body.companyId }).first()
}

/** Deletes a mirrored company and its subscriptions/invoices (local Payment DB only). */
export async function deleteCompany(companyId: string): Promise<boolean> {
  const existing = await db<PaymentCompanyRow>('payment_companies').where({ id: companyId }).first()
  if (!existing) {
    return false
  }

  await db.transaction(async (trx) => {
    const invoiceIds = await trx('payment_invoices').where({ company_id: companyId }).pluck('id')
    if (invoiceIds.length > 0) {
      await trx('payment_invoice_lines').whereIn('invoice_id', invoiceIds).del()
      await trx('payment_invoices').where({ company_id: companyId }).del()
    }
    await trx('payment_subscriptions').where({ company_id: companyId }).del()
    await trx('payment_companies').where({ id: companyId }).del()
    await trx('payment_audit_log').where({ entity_type: 'company', entity_id: companyId }).del()
  })

  return true
}

/**
 * Removes Payment companies that are not in `keepCompanyIds`
 * (e.g. local test mirrors after a WebOnOne backfill).
 */
export async function purgeOrphanCompanies(keepCompanyIds: string[]): Promise<{ deleted: string[] }> {
  const keep = new Set(keepCompanyIds.filter(Boolean))
  const rows = await db<PaymentCompanyRow>('payment_companies').select('id')
  const deleted: string[] = []

  for (const row of rows) {
    if (keep.has(row.id)) continue
    const ok = await deleteCompany(row.id)
    if (ok) deleted.push(row.id)
  }

  return { deleted }
}
