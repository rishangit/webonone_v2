import { nanoid } from 'nanoid'
import {
  applyDiscountPercent,
  resolveApplicableDiscount,
  type ApplicableDiscount,
  type PriceClock,
} from '../utils/applicableCatalogPrice.js'
import {
  fetchUserContactsByIds,
  resolveIdentityDisplay,
} from '../clients/identityUserContactClient.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import * as copiesRepo from '../repositories/companyCatalogCopies.repository.js'
import * as repo from '../repositories/companyCatalogPriceRules.repository.js'
import {
  catalogDiscountKindSchema,
  catalogPriceKindSchema,
  type CatalogDiscountBody,
  type CatalogDiscountKind,
  type CatalogPriceBody,
  type CatalogPriceKind,
} from '../schemas/companyCatalogPriceRules.schema.js'

export type CatalogPriceDto = {
  id: string
  price: number
  isActive: boolean
  createdAt: string
}

export type CatalogDiscountUserDto = {
  id: string
  displayName: string
  email: string | null
  avatarUrl: string | null
}

export type CatalogDiscountVariantDto = {
  id: string
  name: string
}

export type CatalogDiscountDto = {
  id: string
  percent: number
  applyWhen: 'all_time' | 'selected_days' | 'date_range'
  weekdays: number[]
  startDate: string | null
  endDate: string | null
  applyTo: 'everyone' | 'selected_users'
  users: CatalogDiscountUserDto[]
  /** Products: all variants, or the listed ones. Services and spaces stay `all` with an empty list. */
  applyVariants: 'all' | 'selected'
  variants: CatalogDiscountVariantDto[]
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
  if (!parsed.success) throw httpError('Prices are only available for services and spaces', 400)
  return parsed.data
}

export function parseDiscountKind(kind: string): CatalogDiscountKind {
  const parsed = catalogDiscountKindSchema.safeParse(kind)
  if (!parsed.success) throw httpError('Discounts are only available for products, services, and spaces', 400)
  return parsed.data
}

async function assertEntity(companyId: string, kind: CatalogDiscountKind, entityId: string): Promise<void> {
  const row = await catalogRepo.findById(companyId, kind, entityId)
  if (!row) throw httpError('Catalog item not found', 404)
}

function toPriceDto(row: repo.CatalogPriceRow): CatalogPriceDto {
  return {
    id: row.id,
    price: Number(row.price),
    isActive: repo.isActiveFlag(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function normalizeDiscount(body: CatalogDiscountBody): {
  percent: number
  applyWhen: 'all_time' | 'selected_days' | 'date_range'
  weekdays: number[] | null
  startDate: string | null
  endDate: string | null
  applyTo: 'everyone' | 'selected_users'
  userIds: string[]
} {
  const selectedDays = body.applyWhen === 'selected_days'
  const dateRange = body.applyWhen === 'date_range'
  const selectedUsers = body.applyTo === 'selected_users'
  return {
    percent: body.percent,
    applyWhen: body.applyWhen,
    weekdays: selectedDays ? [...new Set(body.weekdays ?? [])].sort((a, b) => a - b) : null,
    startDate: dateRange ? (body.startDate ?? null) : null,
    endDate: dateRange ? (body.endDate ?? null) : null,
    applyTo: body.applyTo,
    userIds: selectedUsers ? [...new Set(body.userIds ?? [])] : [],
  }
}

async function variantIdsForDiscount(
  kind: CatalogDiscountKind,
  entityId: string,
  body: CatalogDiscountBody,
): Promise<string[]> {
  if (kind !== 'products') return []
  if (body.applyVariants === 'all') return []
  if (body.applyVariants === 'selected') return resolveProductVariantIds(entityId, body.variantIds)
  throw httpError('Choose which variants this discount applies to', 400)
}

async function resolveProductVariantIds(
  productId: string,
  variantIds: string[] | null | undefined,
): Promise<string[]> {
  const unique = [...new Set((variantIds ?? []).map((id) => id.trim()).filter(Boolean))]
  if (unique.length === 0) throw httpError('Select a variant', 400)
  const resolved: string[] = []
  for (const variantId of unique) {
    const match = await copiesRepo.resolveCompanyVariant(productId, variantId)
    if (!match.companyVariantId) throw httpError('Variant not found', 400)
    resolved.push(match.libraryVariantId)
  }
  return [...new Set(resolved)]
}

async function toDiscountDtos(rows: repo.CatalogDiscountRow[]): Promise<CatalogDiscountDto[]> {
  const variantLinks = await repo.listDiscountVariants(rows.map((row) => row.id))
  const names = await copiesRepo.variantNamesByLibraryId(
    rows.flatMap((row) =>
      variantLinks
        .filter((link) => link.discount_id === row.id)
        .map((link) => ({ companyProductId: row.entity_id, libraryVariantId: link.variant_id })),
    ),
  )
  const links = await repo.listDiscountUsers(rows.map((row) => row.id))
  const contacts = await fetchUserContactsByIds(links.map((link) => link.user_id))
  const usersByDiscount = new Map<string, CatalogDiscountUserDto[]>()
  for (const link of links) {
    const list = usersByDiscount.get(link.discount_id) ?? []
    const identity = resolveIdentityDisplay(contacts.get(link.user_id), 'User')
    list.push({
      id: link.user_id,
      displayName: identity.displayName,
      email: identity.email,
      avatarUrl: identity.avatarUrl,
    })
    usersByDiscount.set(link.discount_id, list)
  }
  return rows.map((row) => ({
    id: row.id,
    percent: Number(row.percent),
    applyWhen: row.apply_when,
    weekdays: row.apply_when === 'selected_days' ? repo.parseWeekdays(row.weekdays) : [],
    startDate: row.apply_when === 'date_range' ? repo.formatSqlDate(row.start_date) : null,
    endDate: row.apply_when === 'date_range' ? repo.formatSqlDate(row.end_date) : null,
    applyTo: row.apply_to,
    users: row.apply_to === 'selected_users' ? (usersByDiscount.get(row.id) ?? []) : [],
    applyVariants: variantLinks.some((link) => link.discount_id === row.id) ? 'selected' : 'all',
    variants: variantLinks
      .filter((link) => link.discount_id === row.id)
      .map((link) => ({
        id: link.variant_id,
        name: names.get(`${row.entity_id}:${link.variant_id}`) ?? link.variant_id,
      })),
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

export async function listPrices(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
): Promise<CatalogPriceDto[]> {
  await assertCompanySessionAccess(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const rows = await repo.listPrices(companyId, kind, entityId)
  return rows.map(toPriceDto)
}

export async function createPrice(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  body: CatalogPriceBody,
): Promise<CatalogPriceDto> {
  await assertCompanyAdmin(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const existing = await repo.listPrices(companyId, kind, entityId)
  const id = nanoid()
  await repo.insertPrice({
    id,
    companyId,
    kind,
    entityId,
    price: body.price,
    isActive: !existing.some((row) => repo.isActiveFlag(row.is_active)),
  })
  const created = await repo.findPrice(companyId, kind, entityId, id)
  if (!created) throw httpError('Price not found', 404)
  return toPriceDto(created)
}

export async function updatePrice(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  priceId: string,
  body: CatalogPriceBody,
): Promise<CatalogPriceDto> {
  await assertCompanyAdmin(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const existing = await repo.findPrice(companyId, kind, entityId, priceId)
  if (!existing) throw httpError('Price not found', 404)
  await repo.updatePriceAmount(priceId, body.price)
  const updated = await repo.findPrice(companyId, kind, entityId, priceId)
  if (!updated) throw httpError('Price not found', 404)
  return toPriceDto(updated)
}

export async function activatePrice(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  priceId: string,
): Promise<CatalogPriceDto> {
  await assertCompanyAdmin(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const existing = await repo.findPrice(companyId, kind, entityId, priceId)
  if (!existing) throw httpError('Price not found', 404)
  await repo.activatePrice(companyId, kind, entityId, priceId)
  const updated = await repo.findPrice(companyId, kind, entityId, priceId)
  if (!updated) throw httpError('Price not found', 404)
  return toPriceDto(updated)
}

export async function deletePrice(
  userId: string,
  companyId: string,
  kind: CatalogPriceKind,
  entityId: string,
  priceId: string,
): Promise<void> {
  await assertCompanyAdmin(userId, companyId)
  const existing = await repo.findPrice(companyId, kind, entityId, priceId)
  if (!existing) throw httpError('Price not found', 404)
  const wasActive = repo.isActiveFlag(existing.is_active)
  await repo.deletePrice(companyId, priceId)
  if (!wasActive) return
  const remaining = await repo.listPrices(companyId, kind, entityId)
  const next = [...remaining].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0]
  if (next) await repo.activatePrice(companyId, kind, entityId, next.id)
}

export async function listDiscounts(
  userId: string,
  companyId: string,
  kind: CatalogDiscountKind,
  entityId: string,
): Promise<CatalogDiscountDto[]> {
  await assertCompanySessionAccess(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  return toDiscountDtos(await repo.listDiscounts(companyId, kind, entityId))
}

export async function createDiscount(
  userId: string,
  companyId: string,
  kind: CatalogDiscountKind,
  entityId: string,
  body: CatalogDiscountBody,
): Promise<CatalogDiscountDto> {
  await assertCompanyAdmin(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const variantIds = await variantIdsForDiscount(kind, entityId, body)
  const id = nanoid()
  await repo.insertDiscount({ id, companyId, kind, entityId, variantIds, ...normalizeDiscount(body) })
  const created = await repo.findDiscount(companyId, kind, entityId, id)
  if (!created) throw httpError('Discount not found', 404)
  const [dto] = await toDiscountDtos([created])
  return dto
}

export async function updateDiscount(
  userId: string,
  companyId: string,
  kind: CatalogDiscountKind,
  entityId: string,
  discountId: string,
  body: CatalogDiscountBody,
): Promise<CatalogDiscountDto> {
  await assertCompanyAdmin(userId, companyId)
  await assertEntity(companyId, kind, entityId)
  const existing = await repo.findDiscount(companyId, kind, entityId, discountId)
  if (!existing) throw httpError('Discount not found', 404)
  const variantIds = await variantIdsForDiscount(kind, entityId, body)
  await repo.updateDiscount(discountId, { variantIds, ...normalizeDiscount(body) })
  const updated = await repo.findDiscount(companyId, kind, entityId, discountId)
  if (!updated) throw httpError('Discount not found', 404)
  const [dto] = await toDiscountDtos([updated])
  return dto
}

export async function deleteDiscount(
  userId: string,
  companyId: string,
  kind: CatalogDiscountKind,
  entityId: string,
  discountId: string,
): Promise<void> {
  await assertCompanyAdmin(userId, companyId)
  const existing = await repo.findDiscount(companyId, kind, entityId, discountId)
  if (!existing) throw httpError('Discount not found', 404)
  await repo.deleteDiscount(companyId, discountId)
}

async function userIdsByDiscount(rows: repo.CatalogDiscountRow[]): Promise<Map<string, string[]>> {
  const links = await repo.listDiscountUsers(rows.map((row) => row.id))
  const grouped = new Map<string, string[]>()
  for (const link of links) {
    const list = grouped.get(link.discount_id) ?? []
    list.push(link.user_id)
    grouped.set(link.discount_id, list)
  }
  return grouped
}

async function toApplicableDiscounts(
  rows: repo.CatalogDiscountRow[],
  userIdsById: Map<string, string[]>,
): Promise<Map<string, ApplicableDiscount[]>> {
  const variantLinks = await repo.listDiscountVariants(rows.map((row) => row.id))
  const variantIdsByDiscount = new Map<string, string[]>()
  for (const link of variantLinks) {
    const list = variantIdsByDiscount.get(link.discount_id) ?? []
    list.push(link.variant_id)
    variantIdsByDiscount.set(link.discount_id, list)
  }
  const byEntity = new Map<string, ApplicableDiscount[]>()
  for (const row of rows) {
    const list = byEntity.get(row.entity_id) ?? []
    list.push({
      percent: Number(row.percent),
      applyWhen: row.apply_when,
      weekdays: row.apply_when === 'selected_days' ? repo.parseWeekdays(row.weekdays) : [],
      startDate: row.apply_when === 'date_range' ? repo.formatSqlDate(row.start_date) : null,
      endDate: row.apply_when === 'date_range' ? repo.formatSqlDate(row.end_date) : null,
      applyTo: row.apply_to,
      userIds: row.apply_to === 'selected_users' ? (userIdsById.get(row.id) ?? []) : [],
      variantIds: variantIdsByDiscount.get(row.id) ?? [],
      createdAt: new Date(row.created_at).toISOString(),
    })
    byEntity.set(row.entity_id, list)
  }
  return byEntity
}

export type ApplicableListPrice = {
  price: number
  compareAt: number | null
  discountPercent: number | null
}

async function effectivePrices(
  priceRows: repo.CatalogPriceRow[],
  discountRows: repo.CatalogDiscountRow[],
  userIdsById: Map<string, string[]>,
  userId: string | null,
  clock: PriceClock,
): Promise<Map<string, ApplicableListPrice>> {
  const discountsByEntity = await toApplicableDiscounts(discountRows, userIdsById)
  const prices = new Map<string, ApplicableListPrice>()
  for (const row of priceRows) {
    if (!repo.isActiveFlag(row.is_active)) continue
    const base = Number(row.price)
    const discount = resolveApplicableDiscount(
      (discountsByEntity.get(row.entity_id) ?? []).filter((item) => item.variantIds.length === 0),
      userId,
      clock,
    )
    prices.set(
      row.entity_id,
      discount
        ? {
            price: applyDiscountPercent(base, discount.percent),
            compareAt: base,
            discountPercent: discount.percent,
          }
        : { price: base, compareAt: null, discountPercent: null },
    )
  }
  return prices
}

export async function applicableListPriceByEntityId(
  companyId: string,
  kind: CatalogPriceKind,
  entityIds: string[],
  userId: string | null,
  clock: PriceClock,
): Promise<Map<string, ApplicableListPrice>> {
  const [priceRows, discountRows] = await Promise.all([
    repo.listPricesForEntities(companyId, kind, entityIds),
    repo.listDiscountsForEntities(companyId, kind, entityIds),
  ])
  return effectivePrices(priceRows, discountRows, await userIdsByDiscount(discountRows), userId, clock)
}

export async function applicablePublicListPriceByEntityId(
  kind: CatalogPriceKind,
  entityIds: string[],
  clock: PriceClock,
): Promise<Map<string, ApplicableListPrice>> {
  const [priceRows, discountRows] = await Promise.all([
    repo.listPricesForKindEntities(kind, entityIds),
    repo.listDiscountsForKindEntities(kind, entityIds),
  ])
  return effectivePrices(priceRows, discountRows, await userIdsByDiscount(discountRows), null, clock)
}

/** Winning discount percent for each product variant, keyed `productId:libraryVariantId`. */
export async function applicableProductVariantDiscountPercents(
  companyId: string,
  productIds: string[],
  userId: string | null,
  clock: PriceClock,
): Promise<Map<string, number>> {
  const rows = await repo.listDiscountsForEntities(companyId, 'products', productIds)
  const byEntity = await toApplicableDiscounts(rows, await userIdsByDiscount(rows))
  const percents = new Map<string, number>()
  for (const [productId, discounts] of byEntity) {
    const needsAll = discounts.some((discount) => discount.variantIds.length === 0)
    const allVariantIds = needsAll
      ? (await copiesRepo.listVariants(productId)).map((row) => row.library_variant_id)
      : []
    const byVariant = new Map<string, ApplicableDiscount[]>()
    for (const discount of discounts) {
      const targets = discount.variantIds.length > 0 ? discount.variantIds : allVariantIds
      for (const variantId of targets) {
        const list = byVariant.get(variantId) ?? []
        list.push(discount)
        byVariant.set(variantId, list)
      }
    }
    for (const [variantId, list] of byVariant) {
      const match = resolveApplicableDiscount(list, userId, clock)
      if (match) percents.set(`${productId}:${variantId}`, match.percent)
    }
  }
  return percents
}

export async function deletePriceRulesForCatalogItem(
  companyId: string,
  kind: string,
  entityId: string,
): Promise<void> {
  const parsed = catalogDiscountKindSchema.safeParse(kind)
  if (!parsed.success) return
  await repo.deletePricingForEntity(companyId, parsed.data, entityId)
}
