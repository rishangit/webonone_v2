import { db } from '../models/db.js'
import type {
  CatalogDiscountKind,
  CatalogPriceKind,
} from '../schemas/companyCatalogPriceRules.schema.js'

export type CatalogPriceRow = {
  id: string
  company_id: string
  entity_kind: CatalogPriceKind
  entity_id: string
  price: string | number
  is_active: boolean | number
  created_at: Date
  updated_at: Date
}

export type CatalogDiscountRow = {
  id: string
  company_id: string
  entity_kind: CatalogDiscountKind
  entity_id: string
  percent: string | number
  apply_when: 'all_time' | 'selected_days' | 'date_range'
  weekdays: string | number[] | null
  start_date: string | null
  end_date: string | null
  apply_to: 'everyone' | 'selected_users'
  created_at: Date
  updated_at: Date
}

export function isActiveFlag(value: boolean | number): boolean {
  return value === true || value === 1
}

export function parseWeekdays(value: string | number[] | null | undefined): number[] {
  if (value == null) return []
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? safeJsonArray(value)
      : []
  return [...new Set(source.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort(
    (a, b) => a - b,
  )
}

function safeJsonArray(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function formatSqlDate(value: string | null | undefined): string | null {
  if (value == null) return null
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

function entityScope(companyId: string, kind: CatalogDiscountKind, entityId: string) {
  return { company_id: companyId, entity_kind: kind, entity_id: entityId }
}

export async function listPrices(
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
): Promise<CatalogPriceRow[]> {
  return db('company_catalog_prices')
    .where(entityScope(companyId, kind, entityId))
    .orderBy('created_at', 'asc')
}

export async function listPricesForEntities(
  companyId: string,
  kind: CatalogPriceKind,
  entityIds: string[],
): Promise<CatalogPriceRow[]> {
  const ids = [...new Set(entityIds.filter(Boolean))]
  if (ids.length === 0) return []
  return db('company_catalog_prices')
    .where({ company_id: companyId, entity_kind: kind })
    .whereIn('entity_id', ids)
}

export async function listPricesForKindEntities(
  kind: CatalogPriceKind,
  entityIds: string[],
): Promise<CatalogPriceRow[]> {
  const ids = [...new Set(entityIds.filter(Boolean))]
  if (ids.length === 0) return []
  return db('company_catalog_prices').where({ entity_kind: kind }).whereIn('entity_id', ids)
}

export async function findPrice(
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  priceId: string,
): Promise<CatalogPriceRow | undefined> {
  return db('company_catalog_prices')
    .where({ id: priceId, ...entityScope(companyId, kind, entityId) })
    .first()
}

export async function insertPrice(row: {
  id: string
  companyId: string
  kind: CatalogPriceKind
  entityId: string
  price: number
  isActive: boolean
}): Promise<void> {
  await db('company_catalog_prices').insert({
    id: row.id,
    company_id: row.companyId,
    entity_kind: row.kind,
    entity_id: row.entityId,
    price: row.price,
    is_active: row.isActive,
  })
}

export async function updatePriceAmount(priceId: string, price: number): Promise<void> {
  await db('company_catalog_prices').where({ id: priceId }).update({
    price,
    updated_at: db.fn.now(3),
  })
}

export async function activatePrice(
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  priceId: string,
): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('company_catalog_prices')
      .where(entityScope(companyId, kind, entityId))
      .update({ is_active: false, updated_at: trx.fn.now(3) })
    await trx('company_catalog_prices').where({ id: priceId }).update({
      is_active: true,
      updated_at: trx.fn.now(3),
    })
  })
}

export async function deletePrice(companyId: string, priceId: string): Promise<number> {
  return db('company_catalog_prices').where({ id: priceId, company_id: companyId }).delete()
}

export async function listDiscounts(
  companyId: string,
  kind: CatalogDiscountKind,
  entityId: string,
): Promise<CatalogDiscountRow[]> {
  return db('company_catalog_discounts')
    .where(entityScope(companyId, kind, entityId))
    .orderBy('created_at', 'asc')
}

export async function listDiscountsForEntities(
  companyId: string,
  kind: CatalogDiscountKind,
  entityIds: string[],
): Promise<CatalogDiscountRow[]> {
  const ids = [...new Set(entityIds.filter(Boolean))]
  if (ids.length === 0) return []
  return db('company_catalog_discounts')
    .where({ company_id: companyId, entity_kind: kind })
    .whereIn('entity_id', ids)
}

export async function listDiscountsForKindEntities(
  kind: CatalogDiscountKind,
  entityIds: string[],
): Promise<CatalogDiscountRow[]> {
  const ids = [...new Set(entityIds.filter(Boolean))]
  if (ids.length === 0) return []
  return db('company_catalog_discounts').where({ entity_kind: kind }).whereIn('entity_id', ids)
}

export async function findDiscount(
  companyId: string,
  kind: CatalogDiscountKind,
  entityId: string,
  discountId: string,
): Promise<CatalogDiscountRow | undefined> {
  return db('company_catalog_discounts')
    .where({ id: discountId, ...entityScope(companyId, kind, entityId) })
    .first()
}

export async function listDiscountUsers(
  discountIds: string[],
): Promise<{ discount_id: string; user_id: string }[]> {
  if (discountIds.length === 0) return []
  return db('company_catalog_discount_users')
    .whereIn('discount_id', discountIds)
    .select('discount_id', 'user_id')
}

export async function listDiscountVariants(
  discountIds: string[],
): Promise<{ discount_id: string; variant_id: string }[]> {
  if (discountIds.length === 0) return []
  return db('company_catalog_discount_variants')
    .whereIn('discount_id', discountIds)
    .select('discount_id', 'variant_id')
}

export async function insertDiscount(row: {
  id: string
  companyId: string
  kind: CatalogDiscountKind
  entityId: string
  variantIds: string[]
  percent: number
  applyWhen: 'all_time' | 'selected_days' | 'date_range'
  weekdays: number[] | null
  startDate: string | null
  endDate: string | null
  applyTo: 'everyone' | 'selected_users'
  userIds: string[]
}): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('company_catalog_discounts').insert({
      id: row.id,
      company_id: row.companyId,
      entity_kind: row.kind,
      entity_id: row.entityId,
      percent: row.percent,
      apply_when: row.applyWhen,
      weekdays: row.weekdays == null ? null : JSON.stringify(row.weekdays),
      start_date: row.startDate,
      end_date: row.endDate,
      apply_to: row.applyTo,
    })
    if (row.variantIds.length > 0) {
      await trx('company_catalog_discount_variants').insert(
        row.variantIds.map((variantId) => ({ discount_id: row.id, variant_id: variantId })),
      )
    }
    if (row.userIds.length > 0) {
      await trx('company_catalog_discount_users').insert(
        row.userIds.map((userId) => ({ discount_id: row.id, user_id: userId })),
      )
    }
  })
}

export async function updateDiscount(
  discountId: string,
  row: {
    variantIds: string[]
    percent: number
    applyWhen: 'all_time' | 'selected_days' | 'date_range'
    weekdays: number[] | null
    startDate: string | null
    endDate: string | null
    applyTo: 'everyone' | 'selected_users'
    userIds: string[]
  },
): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('company_catalog_discounts').where({ id: discountId }).update({
      percent: row.percent,
      apply_when: row.applyWhen,
      weekdays: row.weekdays == null ? null : JSON.stringify(row.weekdays),
      start_date: row.startDate,
      end_date: row.endDate,
      apply_to: row.applyTo,
      updated_at: trx.fn.now(3),
    })
    await trx('company_catalog_discount_variants').where({ discount_id: discountId }).delete()
    if (row.variantIds.length > 0) {
      await trx('company_catalog_discount_variants').insert(
        row.variantIds.map((variantId) => ({ discount_id: discountId, variant_id: variantId })),
      )
    }
    await trx('company_catalog_discount_users').where({ discount_id: discountId }).delete()
    if (row.userIds.length > 0) {
      await trx('company_catalog_discount_users').insert(
        row.userIds.map((userId) => ({ discount_id: discountId, user_id: userId })),
      )
    }
  })
}

export async function deleteDiscount(companyId: string, discountId: string): Promise<number> {
  return db('company_catalog_discounts').where({ id: discountId, company_id: companyId }).delete()
}

export async function deletePricingForEntity(
  companyId: string,
  kind: CatalogDiscountKind,
  entityId: string,
): Promise<void> {
  const scope = entityScope(companyId, kind, entityId)
  await db('company_catalog_discounts').where(scope).delete()
  await db('company_catalog_prices').where(scope).delete()
}
