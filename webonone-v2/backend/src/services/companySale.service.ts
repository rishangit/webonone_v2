import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import { fetchUserContact } from '../clients/identityUserContactClient.js'
import * as dataCatalog from '../clients/dataCatalogClient.js'
import * as dataStockClient from '../clients/dataStockClient.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import * as companyRepo from '../repositories/company.repository.js'
import * as saleRepo from '../repositories/companySale.repository.js'
import * as sessionTokenRepo from '../repositories/companyEventSessionToken.repository.js'
import * as eventRepo from '../repositories/companyEvent.repository.js'
import * as sessionRunRepo from '../repositories/companyEventSessionRun.repository.js'
import { notifySaleBillCompleted } from './saleBillNotify.service.js'
import { effectiveStaffId } from './sessionOccurrenceIssue.js'
import type {
  CompleteSaleBody,
  CreateSaleBody,
  SaleItemKind,
  SalePaymentMethod,
  SaleStatus,
  UpsertDraftSaleBody,
} from '../schemas/companySaleSchemas.js'

const KIND_TO_CATALOG: Record<SaleItemKind, catalogRepo.CatalogPricedKind> = {
  product: 'products',
  service: 'services',
  space: 'spaces',
}

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function money(value: number): number {
  return Math.round(value * 100) / 100
}

function quantity(value: number): number {
  return Math.round(value * 1000) / 1000
}

function parseDataEntities(value: string | companyRepo.CompanyDataEntity[] | null | undefined): string[] {
  if (value == null) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export type SaleLineDto = {
  id: string
  lineNo: number
  itemKind: SaleItemKind
  catalogItemId: string
  libraryEntityId: string | null
  name: string
  variantName: string | null
  libraryVariantId: string | null
  libraryStockId: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type SaleDto = {
  id: string
  companyId: string
  billNumber: string | null
  customerUserId: string
  customerDisplayName: string
  customerEmail: string | null
  status: SaleStatus
  paymentMethod: SalePaymentMethod | null
  currency: string
  subtotal: number
  total: number
  notes: string | null
  sessionTokenId: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
  lines: SaleLineDto[]
}

export type SaleListItemDto = Omit<SaleDto, 'lines'>

function toIso(value: Date | string): string {
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? value : d.toISOString()
  }
  return value.toISOString()
}

function mapSale(row: saleRepo.CompanySaleRow, lines: saleRepo.CompanySaleLineRow[] = []): SaleDto {
  return {
    id: row.id,
    companyId: row.company_id,
    billNumber: row.bill_number,
    customerUserId: row.customer_user_id,
    customerDisplayName: row.customer_display_name,
    customerEmail: row.customer_email,
    status: row.status,
    paymentMethod: row.payment_method,
    currency: row.currency,
    subtotal: catalogRepo.parseMoney(row.subtotal) ?? 0,
    total: catalogRepo.parseMoney(row.total) ?? 0,
    notes: row.notes,
    sessionTokenId: row.session_token_id,
    createdByUserId: row.created_by_user_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    lines: lines.map((line) => ({
      id: line.id,
      lineNo: line.line_no,
      itemKind: line.item_kind,
      catalogItemId: line.catalog_item_id,
      libraryEntityId: line.library_entity_id,
      name: line.name_snapshot,
      variantName: line.variant_name_snapshot,
      libraryVariantId: line.library_variant_id,
      libraryStockId: line.library_stock_id,
      quantity: catalogRepo.parseMoney(line.quantity) ?? 0,
      unitPrice: catalogRepo.parseMoney(line.unit_price) ?? 0,
      lineTotal: catalogRepo.parseMoney(line.line_total) ?? 0,
    })),
  }
}

function mapListItem(row: saleRepo.CompanySaleRow): SaleListItemDto {
  const { lines: _lines, ...rest } = mapSale(row)
  return rest
}

async function resolveCatalogDisplayName(
  kind: catalogRepo.CatalogPricedKind,
  row: Record<string, unknown>,
): Promise<string> {
  const mapped = catalogRepo.mapCatalogRow(kind, row) as {
    name?: string | null
    libraryEntityId?: string | null
    bindingMode?: string
  }
  if (mapped.name?.trim()) return mapped.name.trim()
  if (mapped.libraryEntityId) {
    const library = await dataCatalog.listLibraryItemsByIds(kind, [mapped.libraryEntityId])
    const name = library[0]?.name?.trim()
    if (name) return name
  }
  return 'Catalog item'
}

type PreparedSaleLine = {
  id: string
  company_id: string
  line_no: number
  item_kind: SaleItemKind
  catalog_item_id: string
  library_entity_id: string | null
  name_snapshot: string
  variant_name_snapshot: string | null
  library_variant_id: string | null
  library_stock_id: string | null
  quantity: number
  unit_price: number
  line_total: number
}

async function resolveVariantNameSnapshot(
  libraryEntityId: string | null,
  libraryVariantId: string | null,
): Promise<string | null> {
  if (!libraryEntityId || !libraryVariantId) return null
  if (!dataStockClient.hasDataStockConfig()) {
    throw httpError('Stock service is not configured', 503)
  }
  const variant = await dataStockClient.getLibraryProductVariant(libraryEntityId, libraryVariantId)
  if (!variant) {
    throw httpError('Product variant not found', 400)
  }
  return variant.name
}

async function consumeStockForPreparedLines(lines: PreparedSaleLine[]): Promise<void> {
  for (const line of lines) {
    if (line.item_kind !== 'product') continue
    if (!line.library_entity_id || !line.library_variant_id || !line.library_stock_id) continue
    if (!dataStockClient.hasDataStockConfig()) {
      throw httpError('Stock service is not configured', 503)
    }
    try {
      await dataStockClient.consumeLibraryStock({
        productId: line.library_entity_id,
        variantId: line.library_variant_id,
        stockId: line.library_stock_id,
        quantity: line.quantity,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stock consumption failed'
      const statusCode = (err as { statusCode?: number }).statusCode
      throw httpError(message, statusCode === 400 ? 400 : 502)
    }
  }
}

async function consumeStockForSaleLines(lines: saleRepo.CompanySaleLineRow[]): Promise<void> {
  for (const line of lines) {
    if (line.item_kind !== 'product') continue
    if (!line.library_entity_id || !line.library_variant_id || !line.library_stock_id) continue
    const qty = catalogRepo.parseMoney(line.quantity) ?? 0
    if (!dataStockClient.hasDataStockConfig()) {
      throw httpError('Stock service is not configured', 503)
    }
    try {
      await dataStockClient.consumeLibraryStock({
        productId: line.library_entity_id,
        variantId: line.library_variant_id,
        stockId: line.library_stock_id,
        quantity: qty,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stock consumption failed'
      const statusCode = (err as { statusCode?: number }).statusCode
      throw httpError(message, statusCode === 400 ? 400 : 502)
    }
  }
}

async function prepareSaleLines(
  companyId: string,
  enabled: string[],
  lines: CreateSaleBody['lines'],
): Promise<PreparedSaleLine[]> {
  const prepared: PreparedSaleLine[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const catalogKind = KIND_TO_CATALOG[line.itemKind]
    if (enabled.length > 0 && !enabled.includes(catalogKind)) {
      throw httpError(`${line.itemKind} is not enabled for this company`, 400)
    }
    const row = await catalogRepo.findById(companyId, catalogKind, line.catalogItemId)
    if (!row) {
      throw httpError(`Catalog item not found: ${line.catalogItemId}`, 400)
    }
    const qty = quantity(line.quantity)
    const unitPrice = money(line.unitPrice)
    const libraryEntityId = (row.library_entity_id as string | null) ?? null
    const libraryVariantId = line.libraryVariantId ?? null
    const libraryStockId = line.libraryStockId ?? null

    if (line.itemKind === 'product' && (libraryVariantId || libraryStockId)) {
      if (!libraryEntityId) {
        throw httpError('Stock linkage requires a linked library product', 400)
      }
      if (!libraryVariantId || !libraryStockId) {
        throw httpError('Variant and stock are required for stocked product lines', 400)
      }
      if (!dataStockClient.hasDataStockConfig()) {
        throw httpError('Stock service is not configured', 503)
      }
    }

    const variantNameSnapshot = await resolveVariantNameSnapshot(libraryEntityId, libraryVariantId)

    prepared.push({
      id: nanoid(),
      company_id: companyId,
      line_no: i + 1,
      item_kind: line.itemKind,
      catalog_item_id: line.catalogItemId,
      library_entity_id: libraryEntityId,
      name_snapshot: await resolveCatalogDisplayName(catalogKind, row),
      variant_name_snapshot: variantNameSnapshot,
      library_variant_id: libraryVariantId,
      library_stock_id: libraryStockId,
      quantity: qty,
      unit_price: unitPrice,
      line_total: money(qty * unitPrice),
    })
  }
  return prepared
}

async function resolveSessionToken(
  companyId: string,
  sessionTokenId: string,
  customerUserId: string,
): Promise<string> {
  const token = await sessionTokenRepo.findTokenById(companyId, sessionTokenId)
  if (!token) {
    throw httpError('Session token not found', 404)
  }
  if (token.user_id !== customerUserId) {
    throw httpError('Customer does not match session token', 400)
  }
  return token.id
}

function tokenOccurrenceDate(token: { occurrence_date: string | Date }): string {
  if (typeof token.occurrence_date === 'string') return token.occurrence_date.slice(0, 10)
  return token.occurrence_date.toISOString().slice(0, 10)
}

async function assertSessionTokenSaleActor(
  userId: string,
  companyId: string,
  sessionTokenId: string,
): Promise<void> {
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role === 'company_admin') return

  const token = await sessionTokenRepo.findTokenById(companyId, sessionTokenId)
  if (!token) {
    throw httpError('Session token not found', 404)
  }
  const event = await eventRepo.findEventById(companyId, token.event_id)
  if (!event) {
    throw httpError('Event not found', 404)
  }
  const occurrenceDate = tokenOccurrenceDate(token)
  const run = await sessionRunRepo.findRunForSession(companyId, token.event_id, occurrenceDate)
  const effectiveId = effectiveStaffId(event.staff_id, run)
  const allowed = await eventRepo.memberIsAssignedStaff(companyId, userId, event, {
    effectiveStaffId: effectiveId,
  })
  if (!allowed) {
    throw httpError('Session staff access required', 403)
  }
}

async function resolveCustomerContact(
  companyId: string,
  customerUserId: string,
  sessionTokenId: string | null,
): Promise<{ displayName: string; email: string | null }> {
  const contact = await fetchUserContact(customerUserId)
  let displayName = contact?.displayName?.trim() || 'Customer'
  let email = contact?.email?.trim() || null

  if ((!email || displayName === 'Customer') && sessionTokenId) {
    const token = await sessionTokenRepo.findTokenById(companyId, sessionTokenId)
    if (token) {
      if (!email && token.user_email?.trim()) {
        email = token.user_email.trim()
      }
      if (displayName === 'Customer' && token.user_display_name?.trim()) {
        displayName = token.user_display_name.trim()
      }
    }
  }

  return { displayName, email }
}

async function ensureSaleCustomerEmailFromToken(
  companyId: string,
  saleId: string,
): Promise<void> {
  const row = await saleRepo.findSaleById(companyId, saleId)
  if (!row?.session_token_id || row.customer_email?.trim()) return

  const token = await sessionTokenRepo.findTokenById(companyId, row.session_token_id)
  const email = token?.user_email?.trim()
  if (!email) return

  await db('company_sales')
    .where({ id: saleId, company_id: companyId })
    .update({ customer_email: email, updated_at: new Date() })
}

export async function createSale(
  userId: string,
  companyId: string,
  body: CreateSaleBody,
): Promise<SaleDto> {
  const member = await roleRepo.findCompanyMemberRole(body.customerUserId, companyId)
  if (!member) {
    throw httpError('Customer is not assigned to this company', 400)
  }

  const company = await companyRepo.findCompanyById(companyId)
  if (!company) {
    throw httpError('Company not found', 404)
  }
  const enabled = parseDataEntities(company.data_entities)

  const contact = await fetchUserContact(body.customerUserId)
  const customerDisplayName = contact?.displayName?.trim() || 'Customer'
  const customerEmail = contact?.email ?? null

  let sessionTokenId: string | null = null
  if (body.sessionTokenId) {
    await assertSessionTokenSaleActor(userId, companyId, body.sessionTokenId)
    sessionTokenId = await resolveSessionToken(companyId, body.sessionTokenId, body.customerUserId)
  }

  const prepared = await prepareSaleLines(companyId, enabled, body.lines)
  await consumeStockForPreparedLines(prepared)
  const subtotal = money(prepared.reduce((sum, line) => sum + line.line_total, 0))
  const saleId = nanoid()
  const now = new Date()

  await db.transaction(async (trx) => {
    const billNumber = await saleRepo.allocateBillNumber(trx, companyId)
    await saleRepo.insertSale(trx, {
      id: saleId,
      company_id: companyId,
      bill_number: billNumber,
      customer_user_id: body.customerUserId,
      customer_display_name: customerDisplayName,
      customer_email: customerEmail,
      status: 'completed',
      payment_method: body.paymentMethod,
      currency: 'LKR',
      subtotal,
      total: subtotal,
      notes: body.notes?.trim() || null,
      session_token_id: sessionTokenId,
      created_by_user_id: userId,
      created_at: now,
      updated_at: now,
    })
    await saleRepo.insertSaleLines(
      trx,
      prepared.map((line) => ({ ...line, sale_id: saleId })),
    )
  })

  const completed = await getSale(companyId, saleId)
  notifySaleBillCompleted(completed)
  return completed
}

export async function getDraftSaleForSessionToken(
  companyId: string,
  sessionTokenId: string,
): Promise<SaleDto | null> {
  const row = await saleRepo.findDraftBySessionToken(companyId, sessionTokenId)
  if (!row) return null
  const lines = await saleRepo.listSaleLines(row.id)
  return mapSale(row, lines)
}

export async function getSessionTokenBill(
  companyId: string,
  sessionTokenId: string,
): Promise<SaleDto | null> {
  const draft = await getDraftSaleForSessionToken(companyId, sessionTokenId)
  if (draft) return draft

  const rows = await saleRepo.listSalesForSessionToken(companyId, sessionTokenId, 1)
  const latest = rows[0]
  if (!latest) return null

  const lines = await saleRepo.listSaleLines(latest.id)
  return mapSale(latest, lines)
}

export async function upsertDraftSale(
  userId: string,
  companyId: string,
  sessionTokenId: string,
  body: UpsertDraftSaleBody,
): Promise<SaleDto> {
  const member = await roleRepo.findCompanyMemberRole(body.customerUserId, companyId)
  if (!member) {
    throw httpError('Customer is not assigned to this company', 400)
  }

  const company = await companyRepo.findCompanyById(companyId)
  if (!company) {
    throw httpError('Company not found', 404)
  }
  const enabled = parseDataEntities(company.data_entities)

  await assertSessionTokenSaleActor(userId, companyId, sessionTokenId)

  const resolvedTokenId = await resolveSessionToken(companyId, sessionTokenId, body.customerUserId)

  const { displayName: customerDisplayName, email: customerEmail } = await resolveCustomerContact(
    companyId,
    body.customerUserId,
    resolvedTokenId,
  )

  const prepared = await prepareSaleLines(companyId, enabled, body.lines)
  const subtotal = money(prepared.reduce((sum, line) => sum + line.line_total, 0))
  const notes = body.notes?.trim() || null
  const now = new Date()

  const existing = await saleRepo.findDraftBySessionToken(companyId, resolvedTokenId)
  const saleId = existing?.id ?? nanoid()

  await db.transaction(async (trx) => {
    if (existing) {
      await saleRepo.updateSaleDraft(trx, companyId, saleId, {
        subtotal,
        total: subtotal,
        customer_display_name: customerDisplayName,
        customer_email: customerEmail,
        notes,
        updated_at: now,
      })
      await saleRepo.deleteSaleLines(trx, saleId)
    } else {
      await saleRepo.insertSale(trx, {
        id: saleId,
        company_id: companyId,
        bill_number: null,
        customer_user_id: body.customerUserId,
        customer_display_name: customerDisplayName,
        customer_email: customerEmail,
        status: 'draft',
        payment_method: null,
        currency: 'LKR',
        subtotal,
        total: subtotal,
        notes,
        session_token_id: resolvedTokenId,
        created_by_user_id: userId,
        created_at: now,
        updated_at: now,
      })
    }
    await saleRepo.insertSaleLines(
      trx,
      prepared.map((line) => ({ ...line, sale_id: saleId })),
    )
  })

  return getSale(companyId, saleId)
}

export async function completeSale(
  userId: string,
  companyId: string,
  saleId: string,
  body: CompleteSaleBody,
): Promise<SaleDto> {
  const existing = await saleRepo.findSaleById(companyId, saleId)
  if (!existing) {
    throw httpError('Sale not found', 404)
  }
  if (existing.status !== 'draft') {
    throw httpError('Only draft sales can be completed', 409)
  }
  if (existing.session_token_id) {
    await assertSessionTokenSaleActor(userId, companyId, existing.session_token_id)
  }

  const lines = await saleRepo.listSaleLines(saleId)
  if (lines.length === 0) {
    throw httpError('Add at least one item before closing the sale', 400)
  }

  await consumeStockForSaleLines(lines)

  const now = new Date()
  await db.transaction(async (trx) => {
    const billNumber = await saleRepo.allocateBillNumber(trx, companyId)
    await saleRepo.completeSaleRow(trx, companyId, saleId, {
      bill_number: billNumber,
      payment_method: body.paymentMethod,
      notes: body.notes === undefined ? existing.notes : body.notes?.trim() || null,
      updated_at: now,
    })
  })

  await ensureSaleCustomerEmailFromToken(companyId, saleId)
  const completed = await getSale(companyId, saleId)
  notifySaleBillCompleted(completed)
  return completed
}

export async function listSales(
  companyId: string,
  options: {
    q?: string
    customerUserId?: string
    itemKind?: SaleItemKind
    status?: SaleStatus
    from?: string
    to?: string
    page?: number
    pageSize?: number
  },
): Promise<{ items: SaleListItemDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(48, Math.max(1, options.pageSize ?? 12))
  const { rows, total } = await saleRepo.listSalesForCompany(companyId, {
    q: options.q?.trim() || undefined,
    customerUserId: options.customerUserId,
    itemKind: options.itemKind,
    status: options.status,
    from: options.from,
    to: options.to,
    page,
    pageSize,
  })
  return {
    items: rows.map(mapListItem),
    total,
    page,
    pageSize,
  }
}

export async function getSale(companyId: string | null, id: string): Promise<SaleDto> {
  const row = companyId
    ? await saleRepo.findSaleById(companyId, id)
    : await saleRepo.findSaleByIdAny(id)
  if (!row) {
    throw httpError('Sale not found', 404)
  }
  const lines = await saleRepo.listSaleLines(row.id)
  return mapSale(row, lines)
}

export async function listSalesForSessionToken(
  companyId: string,
  sessionTokenId: string,
): Promise<SaleListItemDto[]> {
  const rows = await saleRepo.listSalesForSessionToken(companyId, sessionTokenId)
  return rows.map(mapListItem)
}

export async function voidSale(companyId: string, id: string): Promise<SaleDto> {
  const existing = await saleRepo.findSaleById(companyId, id)
  if (!existing) {
    throw httpError('Sale not found', 404)
  }
  if (existing.status === 'void') {
    throw httpError('Sale is already voided', 409)
  }
  if (existing.status === 'draft') {
    throw httpError('Draft sales cannot be voided', 409)
  }
  const updated = await saleRepo.voidSale(companyId, id)
  if (!updated) {
    throw httpError('Sale not found', 404)
  }
  const lines = await saleRepo.listSaleLines(updated.id)
  return mapSale(updated, lines)
}
