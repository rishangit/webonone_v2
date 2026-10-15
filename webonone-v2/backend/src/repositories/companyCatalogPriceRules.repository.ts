import { db } from '../models/db.js'
import type { CatalogPriceKind } from '../schemas/companyCatalogPriceRules.schema.js'

export type PriceRuleRow = {
  id: string
  company_id: string
  entity_kind: CatalogPriceKind
  entity_id: string
  price: string | number
  apply_when: 'all_time' | 'selected_days'
  weekdays: string | number[] | null
  start_time: string | Date | null
  end_time: string | Date | null
  apply_to: 'everyone' | 'selected_users'
  created_at: Date
  updated_at: Date
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

export function formatSqlTime(value: string | Date | null | undefined): string | null {
  if (value == null) return null
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, '0')
    const minutes = String(value.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
  const match = String(value).match(/(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : null
}

export async function listRules(
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
): Promise<PriceRuleRow[]> {
  return db('company_catalog_price_rules')
    .where({ company_id: companyId, entity_kind: kind, entity_id: entityId })
    .orderBy('created_at', 'asc')
}

export async function listRulesForEntities(
  companyId: string,
  kind: CatalogPriceKind,
  entityIds: string[],
): Promise<PriceRuleRow[]> {
  const ids = [...new Set(entityIds.filter(Boolean))]
  if (ids.length === 0) return []
  return db('company_catalog_price_rules')
    .where({ company_id: companyId, entity_kind: kind })
    .whereIn('entity_id', ids)
}

export async function listRulesForKindEntities(
  kind: CatalogPriceKind,
  entityIds: string[],
): Promise<PriceRuleRow[]> {
  const ids = [...new Set(entityIds.filter(Boolean))]
  if (ids.length === 0) return []
  return db('company_catalog_price_rules').where({ entity_kind: kind }).whereIn('entity_id', ids)
}

export async function findRule(
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  ruleId: string,
): Promise<PriceRuleRow | undefined> {
  return db('company_catalog_price_rules')
    .where({ id: ruleId, company_id: companyId, entity_kind: kind, entity_id: entityId })
    .first()
}

export async function listRuleUsers(ruleIds: string[]): Promise<{ rule_id: string; user_id: string }[]> {
  if (ruleIds.length === 0) return []
  return db('company_catalog_price_rule_users').whereIn('rule_id', ruleIds).select('rule_id', 'user_id')
}

export async function insertRule(
  row: {
    id: string
    companyId: string
    kind: CatalogPriceKind
    entityId: string
    price: number
    applyWhen: 'all_time' | 'selected_days'
    weekdays: number[] | null
    startTime: string | null
    endTime: string | null
    applyTo: 'everyone' | 'selected_users'
    userIds: string[]
  },
): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('company_catalog_price_rules').insert({
      id: row.id,
      company_id: row.companyId,
      entity_kind: row.kind,
      entity_id: row.entityId,
      price: row.price,
      apply_when: row.applyWhen,
      weekdays: row.weekdays == null ? null : JSON.stringify(row.weekdays),
      start_time: row.startTime,
      end_time: row.endTime,
      apply_to: row.applyTo,
    })
    if (row.userIds.length > 0) {
      await trx('company_catalog_price_rule_users').insert(
        row.userIds.map((userId) => ({ rule_id: row.id, user_id: userId })),
      )
    }
  })
}

export async function updateRule(
  ruleId: string,
  row: {
    price: number
    applyWhen: 'all_time' | 'selected_days'
    weekdays: number[] | null
    startTime: string | null
    endTime: string | null
    applyTo: 'everyone' | 'selected_users'
    userIds: string[]
  },
): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('company_catalog_price_rules').where({ id: ruleId }).update({
      price: row.price,
      apply_when: row.applyWhen,
      weekdays: row.weekdays == null ? null : JSON.stringify(row.weekdays),
      start_time: row.startTime,
      end_time: row.endTime,
      apply_to: row.applyTo,
      updated_at: trx.fn.now(3),
    })
    await trx('company_catalog_price_rule_users').where({ rule_id: ruleId }).delete()
    if (row.userIds.length > 0) {
      await trx('company_catalog_price_rule_users').insert(
        row.userIds.map((userId) => ({ rule_id: ruleId, user_id: userId })),
      )
    }
  })
}

export async function deleteRule(companyId: string, ruleId: string): Promise<number> {
  return db('company_catalog_price_rules').where({ id: ruleId, company_id: companyId }).delete()
}

export async function deleteRulesForEntity(
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
): Promise<void> {
  await db('company_catalog_price_rules')
    .where({ company_id: companyId, entity_kind: kind, entity_id: entityId })
    .delete()
}
