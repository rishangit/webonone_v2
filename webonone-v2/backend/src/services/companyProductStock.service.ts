import { nanoid } from 'nanoid'
import {
  fetchUserContactsByIds,
  type IdentityUserContact,
} from '../clients/identityUserContactClient.js'
import { db } from '../models/db.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import type { CreateCompanyProductStockBody } from '../schemas/companyCatalogSchemas.js'

const TABLE = 'company_product_stocks'
const COUNTERS = 'company_stock_counters'
export const COMPANY_STOCK_BATCH_PATTERN = /^BATCH-(\d{6})$/

export type CompanyProductStockDto = {
  id: string
  variantId: string
  quantity: number
  batchNumber: string
  costPrice: number
  sellPrice: number
  purchaseDate: string
  expiredDate: string | null
  supplierUserId: string | null
  supplierDisplayName: string | null
  supplierEmail: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type StockRow = {
  id: string
  company_id: string
  company_product_id: string
  library_product_id: string
  library_variant_id: string
  quantity: string | number
  batch_number: string
  cost_price: string | number
  sell_price: string | number
  purchase_date: Date | string
  expired_date: Date | string | null
  supplier_user_id: string | null
  is_active: boolean | number
  created_at: Date
  updated_at: Date
}

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function formatDate(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function displayNameFromEmail(email: string | null | undefined): string | null {
  const local = email?.split('@')[0]?.trim()
  return local || null
}

function resolveSupplier(contact: IdentityUserContact | undefined): {
  supplierDisplayName: string | null
  supplierEmail: string | null
} {
  if (!contact) return { supplierDisplayName: null, supplierEmail: null }
  return {
    supplierDisplayName: contact.displayName?.trim() || displayNameFromEmail(contact.email),
    supplierEmail: contact.email ?? null,
  }
}

function rowToDto(
  row: StockRow,
  supplier: { supplierDisplayName: string | null; supplierEmail: string | null },
): CompanyProductStockDto {
  return {
    id: row.id,
    variantId: row.library_variant_id,
    quantity: Number(row.quantity),
    batchNumber: row.batch_number,
    costPrice: Number(row.cost_price),
    sellPrice: Number(row.sell_price),
    purchaseDate: formatDate(row.purchase_date),
    expiredDate: row.expired_date != null ? formatDate(row.expired_date) : null,
    supplierUserId: row.supplier_user_id,
    supplierDisplayName: supplier.supplierDisplayName,
    supplierEmail: supplier.supplierEmail,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function hydrateStocks(rows: StockRow[]): Promise<CompanyProductStockDto[]> {
  const contacts = await fetchUserContactsByIds(
    rows.map((row) => row.supplier_user_id).filter((id): id is string => Boolean(id)),
  )
  return rows.map((row) =>
    rowToDto(
      row,
      row.supplier_user_id
        ? resolveSupplier(contacts.get(row.supplier_user_id))
        : { supplierDisplayName: null, supplierEmail: null },
    ),
  )
}

async function hydrateStock(row: StockRow): Promise<CompanyProductStockDto> {
  const [item] = await hydrateStocks([row])
  return item!
}

async function requireLinkedProduct(companyId: string, companyProductId: string) {
  const row = await catalogRepo.findById(companyId, 'products', companyProductId)
  if (!row) throw httpError('Catalog item not found', 404)
  const libraryProductId =
    typeof row.library_entity_id === 'string' ? row.library_entity_id.trim() : ''
  if (!libraryProductId) {
    throw httpError('Stock requires a linked library product', 400)
  }
  return { row, libraryProductId }
}

async function suggestBatchNumber(companyId: string): Promise<string> {
  const counter = (await db(COUNTERS).where({ company_id: companyId }).first()) as
    | { next_seq: number }
    | undefined
  const seq = counter?.next_seq ?? 1
  return `BATCH-${String(seq).padStart(6, '0')}`
}

async function advanceBatchCounter(companyId: string, batchNumber: string): Promise<void> {
  const match = COMPANY_STOCK_BATCH_PATTERN.exec(batchNumber.trim())
  if (!match) return
  const usedSeq = Number.parseInt(match[1]!, 10)
  if (!Number.isFinite(usedSeq) || usedSeq < 1) return

  await db.transaction(async (trx) => {
    const row = (await trx(COUNTERS).where({ company_id: companyId }).forUpdate().first()) as
      | { next_seq: number }
      | undefined
    const nextSeq = row?.next_seq ?? 1
    const newNext = Math.max(nextSeq, usedSeq + 1)
    if (row) {
      await trx(COUNTERS).where({ company_id: companyId }).update({ next_seq: newNext })
    } else {
      await trx(COUNTERS).insert({ company_id: companyId, next_seq: newNext })
    }
  })
}

export async function suggestCompanyStockBatchNumber(companyId: string): Promise<string> {
  return suggestBatchNumber(companyId)
}

export async function listCompanyProductVariantStocks(
  companyId: string,
  companyProductId: string,
  libraryVariantId: string,
): Promise<CompanyProductStockDto[]> {
  await requireLinkedProduct(companyId, companyProductId)
  const rows = (await db<StockRow>(TABLE)
    .where({
      company_id: companyId,
      company_product_id: companyProductId,
      library_variant_id: libraryVariantId,
    })
    .orderBy([
      { column: 'is_active', order: 'desc' },
      { column: 'purchase_date', order: 'desc' },
      { column: 'created_at', order: 'desc' },
    ])) as StockRow[]
  return hydrateStocks(rows)
}

export async function listCompanyProductStocks(
  companyId: string,
  companyProductId: string,
): Promise<CompanyProductStockDto[]> {
  await requireLinkedProduct(companyId, companyProductId)
  const rows = (await db<StockRow>(TABLE)
    .where({ company_id: companyId, company_product_id: companyProductId })
    .orderBy([
      { column: 'is_active', order: 'desc' },
      { column: 'purchase_date', order: 'desc' },
      { column: 'created_at', order: 'desc' },
    ])) as StockRow[]
  return hydrateStocks(rows)
}

export async function listCompanyStocksForLibraryVariant(
  companyId: string,
  libraryVariantId: string,
): Promise<Array<{ id: string; variantId: string; quantity: number; sellPrice: number; isActive: boolean }>> {
  const rows = (await db<StockRow>(TABLE)
    .where({ company_id: companyId, library_variant_id: libraryVariantId })
    .orderBy([
      { column: 'is_active', order: 'desc' },
      { column: 'created_at', order: 'desc' },
    ])) as StockRow[]
  return rows.map((row) => ({
    id: row.id,
    variantId: row.library_variant_id,
    quantity: Number(row.quantity),
    sellPrice: Number(row.sell_price),
    isActive: Boolean(row.is_active),
  }))
}

export async function getActiveSellPricesByLibraryProduct(
  pairs: Array<{ companyId: string; libraryProductId: string }>,
): Promise<Map<string, number>> {
  const prices = new Map<string, number>()
  const unique = pairs.filter((p) => p.companyId && p.libraryProductId)
  if (unique.length === 0) return prices

  const companyIds = [...new Set(unique.map((p) => p.companyId))]
  const libraryIds = [...new Set(unique.map((p) => p.libraryProductId))]
  const rows = (await db<StockRow>(TABLE)
    .whereIn('company_id', companyIds)
    .whereIn('library_product_id', libraryIds)
    .orderBy([
      { column: 'is_active', order: 'desc' },
      { column: 'created_at', order: 'desc' },
    ])) as StockRow[]

  for (const row of rows) {
    const key = `${row.company_id}:${row.library_product_id}`
    if (prices.has(key)) continue
    const sell = Number(row.sell_price)
    if (Number.isFinite(sell)) prices.set(key, sell)
  }
  return prices
}

export async function getCompanyProductStock(
  companyId: string,
  companyProductId: string,
  libraryVariantId: string,
  stockId: string,
): Promise<CompanyProductStockDto> {
  await requireLinkedProduct(companyId, companyProductId)
  const row = (await db<StockRow>(TABLE)
    .where({
      id: stockId,
      company_id: companyId,
      company_product_id: companyProductId,
      library_variant_id: libraryVariantId,
    })
    .first()) as StockRow | undefined
  if (!row) throw httpError('Stock not found', 404)
  return hydrateStock(row)
}

export async function getCompanyStockById(
  companyId: string,
  stockId: string,
): Promise<{ id: string; variantId: string; costPrice: number; quantity: number } | null> {
  const row = (await db<StockRow>(TABLE)
    .where({ id: stockId, company_id: companyId })
    .first()) as StockRow | undefined
  if (!row) return null
  return {
    id: row.id,
    variantId: row.library_variant_id,
    costPrice: Number(row.cost_price),
    quantity: Number(row.quantity),
  }
}

export async function createCompanyProductStock(
  companyId: string,
  companyProductId: string,
  libraryVariantId: string,
  body: CreateCompanyProductStockBody,
): Promise<CompanyProductStockDto> {
  const { libraryProductId } = await requireLinkedProduct(companyId, companyProductId)
  const variantId = libraryVariantId.trim()
  if (!variantId) throw httpError('Variant is required', 400)

  const existing = await db(TABLE)
    .where({
      company_id: companyId,
      library_variant_id: variantId,
      batch_number: body.batch_number,
    })
    .first()
  if (existing) {
    throw httpError('A stock batch with this batch number already exists for this variant', 400)
  }

  const id = nanoid()
  const now = db.fn.now(3)
  const existingForVariant = await db(TABLE)
    .where({ company_id: companyId, library_variant_id: variantId })
    .first()
  const isFirst = !existingForVariant

  await db(TABLE).insert({
    id,
    company_id: companyId,
    company_product_id: companyProductId,
    library_product_id: libraryProductId,
    library_variant_id: variantId,
    quantity: body.quantity,
    batch_number: body.batch_number,
    cost_price: body.cost_price,
    sell_price: body.sell_price,
    purchase_date: body.purchase_date,
    expired_date: body.expired_date ?? null,
    supplier_user_id: body.supplier_user_id ?? null,
    is_active: isFirst,
    created_at: now,
    updated_at: now,
  })

  const row = (await db<StockRow>(TABLE).where({ id }).first()) as StockRow | undefined
  if (!row) throw httpError('Failed to create stock', 500)
  await advanceBatchCounter(companyId, body.batch_number)
  return hydrateStock(row)
}

export async function updateCompanyProductStock(
  companyId: string,
  companyProductId: string,
  libraryVariantId: string,
  stockId: string,
  body: CreateCompanyProductStockBody,
): Promise<CompanyProductStockDto> {
  await requireLinkedProduct(companyId, companyProductId)
  const variantId = libraryVariantId.trim()
  const existing = await db(TABLE)
    .where({
      id: stockId,
      company_id: companyId,
      company_product_id: companyProductId,
      library_variant_id: variantId,
    })
    .first()
  if (!existing) throw httpError('Stock not found', 404)

  const duplicate = await db(TABLE)
    .where({
      company_id: companyId,
      library_variant_id: variantId,
      batch_number: body.batch_number,
    })
    .whereNot({ id: stockId })
    .first()
  if (duplicate) {
    throw httpError('A stock batch with this batch number already exists for this variant', 400)
  }

  await db(TABLE)
    .where({ id: stockId })
    .update({
      quantity: body.quantity,
      batch_number: body.batch_number,
      cost_price: body.cost_price,
      sell_price: body.sell_price,
      purchase_date: body.purchase_date,
      expired_date: body.expired_date ?? null,
      supplier_user_id: body.supplier_user_id ?? null,
      updated_at: db.fn.now(3),
    })

  const row = (await db<StockRow>(TABLE).where({ id: stockId }).first()) as StockRow | undefined
  if (!row) throw httpError('Stock not found', 404)
  await advanceBatchCounter(companyId, body.batch_number)
  return hydrateStock(row)
}

export async function setCompanyProductStockActive(
  companyId: string,
  companyProductId: string,
  libraryVariantId: string,
  stockId: string,
): Promise<CompanyProductStockDto> {
  await requireLinkedProduct(companyId, companyProductId)
  const variantId = libraryVariantId.trim()
  const stock = await db(TABLE)
    .where({
      id: stockId,
      company_id: companyId,
      company_product_id: companyProductId,
      library_variant_id: variantId,
    })
    .first()
  if (!stock) throw httpError('Stock not found', 404)

  const now = db.fn.now(3)
  await db.transaction(async (trx) => {
    await trx(TABLE)
      .where({ company_id: companyId, library_variant_id: variantId })
      .update({ is_active: false, updated_at: now })
    await trx(TABLE).where({ id: stockId }).update({ is_active: true, updated_at: now })
  })

  const row = (await db<StockRow>(TABLE).where({ id: stockId }).first()) as StockRow | undefined
  if (!row) throw httpError('Stock not found', 404)
  return hydrateStock(row)
}

export async function consumeCompanyStock(input: {
  companyId: string
  libraryVariantId: string
  stockId: string
  quantity: number
}): Promise<{ id: string; variantId: string; quantity: number; costPrice: number }> {
  return db.transaction(async (trx) => {
    const stock = (await trx<StockRow>(TABLE)
      .where({
        id: input.stockId,
        company_id: input.companyId,
        library_variant_id: input.libraryVariantId,
      })
      .forUpdate()
      .first()) as StockRow | undefined
    if (!stock) throw httpError('Stock not found', 404)

    const currentQty = Number(stock.quantity)
    if (currentQty < input.quantity) {
      throw httpError('Insufficient stock quantity', 400)
    }

    await trx(TABLE)
      .where({ id: input.stockId })
      .update({ quantity: currentQty - input.quantity, updated_at: trx.fn.now(3) })

    const row = (await trx<StockRow>(TABLE).where({ id: input.stockId }).first()) as
      | StockRow
      | undefined
    if (!row) throw httpError('Stock not found', 404)
    return {
      id: row.id,
      variantId: row.library_variant_id,
      quantity: Number(row.quantity),
      costPrice: Number(row.cost_price),
    }
  })
}
