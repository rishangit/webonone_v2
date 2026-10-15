import { nanoid } from 'nanoid'
import {
  resolveApplicablePrice,
  type ApplicablePriceRule,
  type PriceClock,
} from '../utils/applicableCatalogPrice.js'
import {
  fetchUserContactsByIds,
  resolveIdentityDisplay,
} from '../clients/identityUserContactClient.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import * as repo from '../repositories/companyCatalogPriceRules.repository.js'
import {
  catalogPriceKindSchema,
  type CatalogPriceKind,
  type CatalogPriceRuleBody,
} from '../schemas/companyCatalogPriceRules.schema.js'

export type CatalogPriceRuleUserDto = {
  id: string
  displayName: string
  email: string | null
  avatarUrl: string | null
}

export type CatalogPriceRuleDto = {
  id: string
  price: number
  applyWhen: 'all_time' | 'selected_days'
  weekdays: number[]
  startTime: string | null
  endTime: string | null
  applyTo: 'everyone' | 'selected_users'
  users: CatalogPriceRuleUserDto[]
  createdAt: string
}

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

async function assertCompanyAdmin(userId: string, companyId: string): Promise<void> {
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin') {
    throw httpError('Company admin access required', 403)
  }
}

async function assertCompanySessionAccess(userId: string, companyId: string): Promise<void> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) return
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin' && membership?.role !== 'member') {
    throw httpError('Company access required', 403)
  }
}

export function parsePriceKind(kind: string): CatalogPriceKind {
  const parsed = catalogPriceKindSchema.safeParse(kind)
  if (!parsed.success) throw httpError('Price list is only available for services and spaces', 400)
  return parsed.data
}

function normalizeBody(body: CatalogPriceRuleBody): {
  price: number
  applyWhen: 'all_time' | 'selected_days'
  weekdays: number[] | null
  startTime: string | null
  endTime: string | null
  applyTo: 'everyone' | 'selected_users'
  userIds: string[]
} {
  const selectedDays = body.applyWhen === 'selected_days'
  const specificTime = selectedDays && body.timeScope === 'specific_time'
  const selectedUsers = body.applyTo === 'selected_users'
  return {
    price: body.price,
    applyWhen: body.applyWhen,
    weekdays: selectedDays ? [...new Set(body.weekdays ?? [])].sort((a, b) => a - b) : null,
    startTime: specificTime ? (body.startTime ?? null) : null,
    endTime: specificTime ? (body.endTime ?? null) : null,
    applyTo: body.applyTo,
    userIds: selectedUsers ? [...new Set(body.userIds ?? [])] : [],
  }
}

async function toDtos(rows: repo.PriceRuleRow[]): Promise<CatalogPriceRuleDto[]> {
  const links = await repo.listRuleUsers(rows.map((row) => row.id))
  const contacts = await fetchUserContactsByIds(links.map((link) => link.user_id))
  const usersByRule = new Map<string, CatalogPriceRuleUserDto[]>()
  for (const link of links) {
    const list = usersByRule.get(link.rule_id) ?? []
    const identity = resolveIdentityDisplay(contacts.get(link.user_id), 'User')
    list.push({
      id: link.user_id,
      displayName: identity.displayName,
      email: identity.email,
      avatarUrl: identity.avatarUrl,
    })
    usersByRule.set(link.rule_id, list)
  }
  return rows.map((row) => ({
    id: row.id,
    price: Number(row.price),
    applyWhen: row.apply_when,
    weekdays: row.apply_when === 'selected_days' ? repo.parseWeekdays(row.weekdays) : [],
    startTime: row.apply_when === 'selected_days' ? repo.formatSqlTime(row.start_time) : null,
    endTime: row.apply_when === 'selected_days' ? repo.formatSqlTime(row.end_time) : null,
    applyTo: row.apply_to,
    users: row.apply_to === 'selected_users' ? (usersByRule.get(row.id) ?? []) : [],
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

async function assertEntity(companyId: string, kind: CatalogPriceKind, entityId: string): Promise<void> {
  const row = await catalogRepo.findById(companyId, kind, entityId)
  if (!row) throw httpError('Catalog item not found', 404)
}

export async function listPriceRules(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
): Promise<CatalogPriceRuleDto[]> {
  await assertCompanySessionAccess(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const rows = await repo.listRules(companyId, kind, entityId)
  return toDtos(rows)
}

export async function createPriceRule(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  body: CatalogPriceRuleBody,
): Promise<CatalogPriceRuleDto> {
  await assertCompanyAdmin(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const normalized = normalizeBody(body)
  const id = nanoid()
  await repo.insertRule({
    id,
    companyId,
    kind,
    entityId,
    ...normalized,
  })
  const rows = await repo.listRules(companyId, kind, entityId)
  const created = rows.find((row) => row.id === id)
  if (!created) throw httpError('Price item not found', 404)
  const [dto] = await toDtos([created])
  return dto
}

export async function updatePriceRule(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  ruleId: string,
  body: CatalogPriceRuleBody,
): Promise<CatalogPriceRuleDto> {
  await assertCompanyAdmin(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const existing = await repo.findRule(companyId, kind, entityId, ruleId)
  if (!existing) throw httpError('Price item not found', 404)
  await repo.updateRule(ruleId, normalizeBody(body))
  const updated = await repo.findRule(companyId, kind, entityId, ruleId)
  if (!updated) throw httpError('Price item not found', 404)
  const [dto] = await toDtos([updated])
  return dto
}

export async function deletePriceRule(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  ruleId: string,
): Promise<void> {
  await assertCompanyAdmin(userId, companyId)
  const existing = await repo.findRule(companyId, kind, entityId, ruleId)
  if (!existing) throw httpError('Price item not found', 404)
  await repo.deleteRule(companyId, ruleId)
}

function toApplicableRules(
  rows: repo.PriceRuleRow[],
  userIdsByRule: Map<string, string[]>,
): ApplicablePriceRule[] {
  return rows.map((row) => ({
    entityId: row.entity_id,
    price: Number(row.price),
    applyWhen: row.apply_when,
    weekdays: row.apply_when === 'selected_days' ? repo.parseWeekdays(row.weekdays) : [],
    startTime: row.apply_when === 'selected_days' ? repo.formatSqlTime(row.start_time) : null,
    endTime: row.apply_when === 'selected_days' ? repo.formatSqlTime(row.end_time) : null,
    applyTo: row.apply_to,
    userIds: row.apply_to === 'selected_users' ? (userIdsByRule.get(row.id) ?? []) : [],
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

async function userIdsByRule(rows: repo.PriceRuleRow[]): Promise<Map<string, string[]>> {
  const links = await repo.listRuleUsers(rows.map((row) => row.id))
  const grouped = new Map<string, string[]>()
  for (const link of links) {
    const list = grouped.get(link.rule_id) ?? []
    list.push(link.user_id)
    grouped.set(link.rule_id, list)
  }
  return grouped
}

function pricesFromRules(
  rules: ApplicablePriceRule[],
  userId: string | null,
  clock: PriceClock,
): Map<string, number> {
  const byEntity = new Map<string, ApplicablePriceRule[]>()
  for (const rule of rules) {
    const list = byEntity.get(rule.entityId) ?? []
    list.push(rule)
    byEntity.set(rule.entityId, list)
  }
  const prices = new Map<string, number>()
  for (const [entityId, entityRules] of byEntity) {
    const price = resolveApplicablePrice(entityRules, userId, clock)
    if (price != null) prices.set(entityId, price)
  }
  return prices
}

export async function applicableListPriceByEntityId(
  companyId: string,
  kind: CatalogPriceKind,
  entityIds: string[],
  userId: string | null,
  clock: PriceClock,
): Promise<Map<string, number>> {
  const rows = await repo.listRulesForEntities(companyId, kind, entityIds)
  return pricesFromRules(toApplicableRules(rows, await userIdsByRule(rows)), userId, clock)
}

export async function applicablePublicListPriceByEntityId(
  kind: CatalogPriceKind,
  entityIds: string[],
  clock: PriceClock,
): Promise<Map<string, number>> {
  const rows = await repo.listRulesForKindEntities(kind, entityIds)
  return pricesFromRules(toApplicableRules(rows, await userIdsByRule(rows)), null, clock)
}

export async function deletePriceRulesForCatalogItem(
  companyId: string,
  kind: string,
  entityId: string,
): Promise<void> {
  const parsed = catalogPriceKindSchema.safeParse(kind)
  if (!parsed.success) return
  await repo.deleteRulesForEntity(companyId, parsed.data, entityId)
}
