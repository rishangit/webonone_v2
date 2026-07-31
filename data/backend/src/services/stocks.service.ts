import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { CreateStockBody } from '../schemas/stocks.schema.js'

export interface StockDto {
  id: string
  variantId: string
  quantity: number
  batchNumber: string
  costPrice: number
  sellPrice: number
  purchaseDate: string
  expiredDate: string | null
  supplierUserId: string
  supplierDisplayName: string
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
  supplier_user_id: string
  supplier_display_name: string
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
    supplier_user_id: body.supplier_user_id,
    supplier_display_name: body.supplier_display_name,
    supplier_email: body.supplier_email ?? null,
    is_active: isFirst,
    created_at: now,
    updated_at: now,
  })

  const row = (await db('data_stocks').where({ id }).first()) as StockRow | undefined
  if (!row) throw new Error('Failed to create stock')
  return rowToDto(row)
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
