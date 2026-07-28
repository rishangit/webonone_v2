import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { CreateProductVariantBody } from '../schemas/productVariants.schema.js'

export interface ProductVariantAttributeValue {
  attributeId: string
  attributeName: string
  attributeValueId: string
  valueText: string | null
  valueNumber: number | null
  valueType: 'number' | 'text'
  unitSymbol: string | null
}

export interface ProductVariantDto {
  id: string
  productId: string
  name: string
  sku: string
  isDefault: boolean
  values: ProductVariantAttributeValue[]
  createdAt: string
  updatedAt: string
}

type VariantRow = {
  id: string
  product_id: string
  name: string
  sku: string
  is_default: boolean | number
  created_at: Date
  updated_at: Date
}

type VariantValueJoinRow = {
  variant_id: string
  attribute_id: string
  attribute_value_id: string
  attribute_name: string
  value_type: string
  value_text: string | null
  value_number: string | number | null
  unit_symbol: string | null
}

type ProductAttributeSnapshot = {
  attributeId: string
  name: string
  values: Array<{ id: string; isDefault: boolean }>
}

function combinationKey(valueIds: string[]): string {
  return [...valueIds].sort().join('|')
}

async function assertProductExists(productId: string): Promise<void> {
  const product = await db('data_products').where({ id: productId }).first()
  if (!product) throw new Error('NOT_FOUND')
}

async function loadProductAttributeSnapshots(
  productId: string,
): Promise<ProductAttributeSnapshot[]> {
  const links = await db('data_product_attributes').where({ product_id: productId })
  if (links.length === 0) return []

  const attributeIds = links.map((link) => link.attribute_id as string)
  const attrRows = await db('data_attributes').whereIn('id', attributeIds)
  const attrById = new Map(attrRows.map((row) => [row.id as string, row]))

  const valueRows = await db('data_product_attribute_values')
    .where({ product_id: productId })
    .whereIn('attribute_id', attributeIds)
    .orderBy('created_at', 'asc')

  const valuesByAttribute = new Map<string, Array<{ id: string; isDefault: boolean }>>()
  for (const row of valueRows) {
    const attributeId = row.attribute_id as string
    const list = valuesByAttribute.get(attributeId) ?? []
    list.push({
      id: row.id as string,
      isDefault: Boolean(row.is_default),
    })
    valuesByAttribute.set(attributeId, list)
  }

  const result: ProductAttributeSnapshot[] = []
  for (const link of links) {
    const attributeId = link.attribute_id as string
    const attr = attrById.get(attributeId)
    if (!attr) continue
    result.push({
      attributeId,
      name: attr.name as string,
      values: valuesByAttribute.get(attributeId) ?? [],
    })
  }
  return result
}

async function loadVariantValues(
  variantIds: string[],
): Promise<Map<string, ProductVariantAttributeValue[]>> {
  const map = new Map<string, ProductVariantAttributeValue[]>()
  if (variantIds.length === 0) return map

  const rows = (await db('data_product_variant_values as vv')
    .join('data_attributes as a', 'a.id', 'vv.attribute_id')
    .join('data_product_attribute_values as pav', 'pav.id', 'vv.attribute_value_id')
    .leftJoin('data_units as u', 'u.id', 'a.unit_id')
    .whereIn('vv.variant_id', variantIds)
    .select(
      'vv.variant_id',
      'vv.attribute_id',
      'vv.attribute_value_id',
      'a.name as attribute_name',
      'a.value_type',
      'pav.value_text',
      'pav.value_number',
      'u.symbol as unit_symbol',
    )
    .orderBy('a.name', 'asc')) as VariantValueJoinRow[]

  for (const row of rows) {
    const list = map.get(row.variant_id) ?? []
    list.push({
      attributeId: row.attribute_id,
      attributeName: row.attribute_name,
      attributeValueId: row.attribute_value_id,
      valueText: row.value_text,
      valueNumber: row.value_number != null ? Number(row.value_number) : null,
      valueType: row.value_type === 'number' ? 'number' : 'text',
      unitSymbol: row.unit_symbol,
    })
    map.set(row.variant_id, list)
  }
  return map
}

function rowToDto(row: VariantRow, values: ProductVariantAttributeValue[]): ProductVariantDto {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    sku: row.sku,
    isDefault: Boolean(row.is_default),
    values,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function getById(variantId: string): Promise<ProductVariantDto | null> {
  const row = (await db('data_product_variants').where({ id: variantId }).first()) as
    | VariantRow
    | undefined
  if (!row) return null
  const valuesMap = await loadVariantValues([variantId])
  return rowToDto(row, valuesMap.get(variantId) ?? [])
}

export async function listProductVariants(productId: string): Promise<ProductVariantDto[]> {
  await assertProductExists(productId)
  const rows = (await db('data_product_variants')
    .where({ product_id: productId })
    .orderBy([
      { column: 'is_default', order: 'desc' },
      { column: 'created_at', order: 'asc' },
    ])) as VariantRow[]

  const valuesMap = await loadVariantValues(rows.map((row) => row.id))
  return rows.map((row) => rowToDto(row, valuesMap.get(row.id) ?? []))
}

async function resolveAttributeValueIds(
  productId: string,
  body: CreateProductVariantBody,
): Promise<Array<{ attributeId: string; attributeValueId: string }>> {
  const attributes = await loadProductAttributeSnapshots(productId)

  if (body.kind === 'default') {
    const picks: Array<{ attributeId: string; attributeValueId: string }> = []
    for (const attr of attributes) {
      if (attr.values.length === 0) continue
      const defaultValue = attr.values.find((value) => value.isDefault)
      if (!defaultValue) {
        throw new Error(
          `VALIDATION: Attribute "${attr.name}" has values but no default is set`,
        )
      }
      picks.push({ attributeId: attr.attributeId, attributeValueId: defaultValue.id })
    }
    return picks
  }

  const provided = new Set(body.attribute_value_ids ?? [])
  const picks: Array<{ attributeId: string; attributeValueId: string }> = []

  for (const attr of attributes) {
    if (attr.values.length === 0) continue

    if (attr.values.length === 1) {
      picks.push({ attributeId: attr.attributeId, attributeValueId: attr.values[0]!.id })
      continue
    }

    const selected = attr.values.find((value) => provided.has(value.id))
    if (!selected) {
      throw new Error(
        `VALIDATION: Select a value for attribute "${attr.name}"`,
      )
    }
    picks.push({ attributeId: attr.attributeId, attributeValueId: selected.id })
  }

  // Reject unknown / mismatched value ids
  for (const valueId of provided) {
    const matched = picks.some((pick) => pick.attributeValueId === valueId)
    if (!matched) {
      const owned = attributes.some((attr) =>
        attr.values.some((value) => value.id === valueId && attr.values.length >= 2),
      )
      if (!owned) {
        throw new Error('VALIDATION: One or more attribute values are invalid for this product')
      }
    }
  }

  return picks
}

async function assertUniqueSku(productId: string, sku: string): Promise<void> {
  const existing = await db('data_product_variants')
    .where({ product_id: productId, sku })
    .first()
  if (existing) {
    throw new Error('VALIDATION: A variant with this SKU already exists for this product')
  }
}

async function assertNoDuplicateCombination(
  productId: string,
  valueIds: string[],
): Promise<void> {
  const existing = await listProductVariants(productId)
  const nextKey = combinationKey(valueIds)
  for (const variant of existing) {
    const key = combinationKey(variant.values.map((value) => value.attributeValueId))
    if (key === nextKey) {
      throw new Error(
        'VALIDATION: A variant with this attribute combination already exists',
      )
    }
  }
}

export async function createProductVariant(
  productId: string,
  body: CreateProductVariantBody,
): Promise<ProductVariantDto> {
  await assertProductExists(productId)

  if (body.kind === 'default') {
    const existingDefault = await db('data_product_variants')
      .where({ product_id: productId, is_default: true })
      .first()
    if (existingDefault) {
      throw new Error('VALIDATION: This product already has a default variant')
    }
  }

  await assertUniqueSku(productId, body.sku)

  const picks = await resolveAttributeValueIds(productId, body)
  await assertNoDuplicateCombination(
    productId,
    picks.map((pick) => pick.attributeValueId),
  )

  const id = nanoid()
  const now = db.fn.now(3)

  await db.transaction(async (trx) => {
    await trx('data_product_variants').insert({
      id,
      product_id: productId,
      name: body.name,
      sku: body.sku,
      is_default: body.kind === 'default',
      created_at: now,
      updated_at: now,
    })

    if (picks.length > 0) {
      await trx('data_product_variant_values').insert(
        picks.map((pick) => ({
          variant_id: id,
          attribute_id: pick.attributeId,
          attribute_value_id: pick.attributeValueId,
        })),
      )
    }
  })

  const created = await getById(id)
  if (!created) throw new Error('Failed to create product variant')
  return created
}
