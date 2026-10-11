import { db } from '../models/db.js'

export type VariantStockLimitsRow = {
  id: string
  company_id: string
  company_product_id: string
  library_variant_id: string
  min_quantity: string | number | null
  max_quantity: string | number | null
  created_at: Date
  updated_at: Date
}

function parseQuantity(value: string | number | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function mapVariantStockLimitsRow(row: VariantStockLimitsRow) {
  return {
    libraryVariantId: row.library_variant_id,
    minQuantity: parseQuantity(row.min_quantity),
    maxQuantity: parseQuantity(row.max_quantity),
  }
}

export async function findVariantStockLimits(
  companyProductId: string,
  libraryVariantId: string,
): Promise<VariantStockLimitsRow | undefined> {
  const row = await db<VariantStockLimitsRow>('company_product_variant_stock_limits')
    .where({ company_product_id: companyProductId, library_variant_id: libraryVariantId })
    .first()
  return row ?? undefined
}

export async function listVariantStockLimitsForProduct(
  companyProductId: string,
): Promise<VariantStockLimitsRow[]> {
  return db<VariantStockLimitsRow>('company_product_variant_stock_limits').where({
    company_product_id: companyProductId,
  })
}

export async function upsertVariantStockLimits(input: {
  id: string
  companyId: string
  companyProductId: string
  libraryVariantId: string
  minQuantity: number | null
  maxQuantity: number | null
}): Promise<VariantStockLimitsRow | null> {
  const existing = await findVariantStockLimits(input.companyProductId, input.libraryVariantId)
  const now = db.fn.now(3)

  if (input.minQuantity == null && input.maxQuantity == null) {
    if (existing) {
      await db('company_product_variant_stock_limits').where({ id: existing.id }).delete()
    }
    return null
  }

  if (existing) {
    await db('company_product_variant_stock_limits')
      .where({ id: existing.id })
      .update({
        min_quantity: input.minQuantity,
        max_quantity: input.maxQuantity,
        updated_at: now,
      })
    const updated = await findVariantStockLimits(input.companyProductId, input.libraryVariantId)
    if (!updated) throw new Error('Failed to update variant stock limits')
    return updated
  }

  await db('company_product_variant_stock_limits').insert({
    id: input.id,
    company_id: input.companyId,
    company_product_id: input.companyProductId,
    library_variant_id: input.libraryVariantId,
    min_quantity: input.minQuantity,
    max_quantity: input.maxQuantity,
    created_at: now,
    updated_at: now,
  })
  const inserted = await findVariantStockLimits(input.companyProductId, input.libraryVariantId)
  if (!inserted) throw new Error('Failed to insert variant stock limits')
  return inserted
}
