import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { CreateStockBody } from '../schemas/stocks.schema.js'

export const COMPANY_STOCK_BATCH_PATTERN = /^BATCH-(\d{6})$/

export interface StockDto {
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
  variant_id: string
  quantity: string | number
  batch_number: string
  cost_price: string | number
  sell_price: string | number
  purchase_date: Date | string
  expired_date: Date | string | null
  supplier_user_id: string | null
  supplier_display_name: string | null
  supplier_email: string | null
  is_active: boolean | number
  created_at: Date
  updated_at: Date
}

function formatDate(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rowToDto(row: StockRow): StockDto {
  return {
    id: row.id,
    variantId: row.variant_id,
    quantity: Number(row.quantity),
    batchNumber: row.batch_number,
    costPrice: Number(row.cost_price),
    sellPrice: Number(row.sell_price),
    purchaseDate: formatDate(row.purchase_date),
    expiredDate: row.expired_date != null ? formatDate(row.expired_date) : null,
    supplierUserId: row.supplier_user_id,
    supplierDisplayName: row.supplier_display_name,
    supplierEmail: row.supplier_email,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function assertVariantBelongsToProduct(
  productId: string,
  variantId: string,
): Promise<void> {
  const product = await db('data_products').where({ id: productId }).first()
  if (!product) throw new Error('NOT_FOUND')

  const variant = await db('data_product_variants')
    .where({ id: variantId, product_id: productId })
    .first()
  if (!variant) throw new Error('NOT_FOUND')
}

export async function suggestBatchNumber(companyId: string): Promise<string> {
  const row = (await db('data_company_stock_counters')
    .where({ company_id: companyId })
    .first()) as { next_seq: number } | undefined
  const seq = row?.next_seq ?? 1
  return `BATCH-${String(seq).padStart(6, '0')}`
}

async function advanceBatchCounter(companyId: string, batchNumber: string): Promise<void> {
  const match = COMPANY_STOCK_BATCH_PATTERN.exec(batchNumber.trim())
  if (!match) return

  const usedSeq = Number.parseInt(match[1]!, 10)
  if (!Number.isFinite(usedSeq) || usedSeq < 1) return

  await db.transaction(async (trx) => {
    const row = (await trx('data_company_stock_counters')
      .where({ company_id: companyId })
      .forUpdate()
      .first()) as { next_seq: number } | undefined

    const nextSeq = row?.next_seq ?? 1
    const newNext = Math.max(nextSeq, usedSeq + 1)

    if (row) {
      await trx('data_company_stock_counters')
        .where({ company_id: companyId })
        .update({ next_seq: newNext })
    } else {
      await trx('data_company_stock_counters').insert({
        company_id: companyId,
        next_seq: newNext,
      })
    }
  })
}

export async function listStocks(
  productId: string,
  variantId: string,
): Promise<StockDto[]> {
  await assertVariantBelongsToProduct(productId, variantId)
  const rows = (await db('data_stocks')
    .where({ variant_id: variantId })
    .orderBy([
      { column: 'is_active', order: 'desc' },
      { column: 'purchase_date', order: 'desc' },
      { column: 'created_at', order: 'desc' },
    ])) as StockRow[]
  return rows.map(rowToDto)
}

export async function createStock(
  productId: string,
  variantId: string,
  body: CreateStockBody,
  companyId: string | null = null,
): Promise<StockDto> {
  await assertVariantBelongsToProduct(productId, variantId)

  const existing = await db('data_stocks')
    .where({ variant_id: variantId, batch_number: body.batch_number })
    .first()
  if (existing) {
    throw new Error('VALIDATION: A stock batch with this batch number already exists for this variant')
  }

  const id = nanoid()
  const now = db.fn.now(3)
  const existingForVariant = await db('data_stocks').where({ variant_id: variantId }).first()
  const isFirst = !existingForVariant

  await db('data_stocks').insert({
    id,
    variant_id: variantId,
    quantity: body.quantity,
    batch_number: body.batch_number,
    cost_price: body.cost_price,
    sell_price: body.sell_price,
    purchase_date: body.purchase_date,
    expired_date: body.expired_date ?? null,
    supplier_user_id: body.supplier_user_id ?? null,
    supplier_display_name: body.supplier_display_name ?? null,
    supplier_email: body.supplier_email ?? null,
    is_active: isFirst,
    created_at: now,
    updated_at: now,
  })

  const row = (await db('data_stocks').where({ id }).first()) as StockRow | undefined
  if (!row) throw new Error('Failed to create stock')

  if (companyId) {
    await advanceBatchCounter(companyId, body.batch_number)
  }

  return rowToDto(row)
}

export async function getStock(
  productId: string,
  variantId: string,
  stockId: string,
): Promise<StockDto> {
  await assertVariantBelongsToProduct(productId, variantId)
  const row = (await db('data_stocks')
    .where({ id: stockId, variant_id: variantId })
    .first()) as StockRow | undefined
  if (!row) throw new Error('NOT_FOUND')
  return rowToDto(row)
}

export async function consumeStock(
  productId: string,
  variantId: string,
  stockId: string,
  quantity: number,
): Promise<StockDto> {
  await assertVariantBelongsToProduct(productId, variantId)

  return db.transaction(async (trx) => {
    const stock = (await trx('data_stocks')
      .where({ id: stockId, variant_id: variantId })
      .forUpdate()
      .first()) as StockRow | undefined
    if (!stock) throw new Error('NOT_FOUND')

    const currentQty = Number(stock.quantity)
    if (currentQty < quantity) {
      throw new Error('VALIDATION: Insufficient stock quantity')
    }

    const now = trx.fn.now(3)
    await trx('data_stocks')
      .where({ id: stockId })
      .update({ quantity: currentQty - quantity, updated_at: now })

    const row = (await trx('data_stocks').where({ id: stockId }).first()) as StockRow | undefined
    if (!row) throw new Error('NOT_FOUND')
    return rowToDto(row)
  })
}

export async function setStockActive(
  productId: string,
  variantId: string,
  stockId: string,
): Promise<StockDto> {
  await assertVariantBelongsToProduct(productId, variantId)

  const stock = (await db('data_stocks')
    .where({ id: stockId, variant_id: variantId })
    .first()) as StockRow | undefined
  if (!stock) throw new Error('NOT_FOUND')

  const now = db.fn.now(3)
  await db.transaction(async (trx) => {
    await trx('data_stocks')
      .where({ variant_id: variantId })
      .update({ is_active: false, updated_at: now })
    await trx('data_stocks')
      .where({ id: stockId })
      .update({ is_active: true, updated_at: now })
  })

  const row = (await db('data_stocks').where({ id: stockId }).first()) as StockRow | undefined
  if (!row) throw new Error('NOT_FOUND')
  return rowToDto(row)
}
