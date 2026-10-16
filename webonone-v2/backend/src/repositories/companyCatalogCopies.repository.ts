import { db } from '../models/db.js'
import type { CatalogGalleryKind } from '../schemas/companyCatalogSchemas.js'

export const COMPANY_CATALOG_ATTRIBUTES = 'company_catalog_entity_attributes'
export const COMPANY_CATALOG_ATTRIBUTE_VALUES = 'company_catalog_entity_attribute_values'
export const COMPANY_PRODUCT_VARIANTS = 'company_product_variants'
export const COMPANY_PRODUCT_VARIANT_VALUES = 'company_product_variant_values'

export type CompanyAttributeValueRow = {
  id: string
  company_id: string
  entity_kind: CatalogGalleryKind
  entity_id: string
  library_attribute_id: string
  library_value_id: string | null
  value_text: string | null
  value_number: string | number | null
  is_default: boolean | number
}

export type CompanyVariantRow = {
  id: string
  company_id: string
  company_product_id: string
  library_variant_id: string
  name: string
  sku: string
  is_default: boolean | number
  created_at: Date
  updated_at: Date
}

export type CompanyVariantValueRow = {
  company_variant_id: string
  library_attribute_id: string
  library_attribute_value_id: string
  company_attribute_value_id: string | null
}

export async function listAttributeLinks(entityKind: CatalogGalleryKind, entityId: string) {
  return db(COMPANY_CATALOG_ATTRIBUTES)
    .where({ entity_kind: entityKind, entity_id: entityId })
    .orderBy('created_at', 'asc')
}

export async function listAttributeValues(entityKind: CatalogGalleryKind, entityId: string) {
  return db<CompanyAttributeValueRow>(COMPANY_CATALOG_ATTRIBUTE_VALUES)
    .where({ entity_kind: entityKind, entity_id: entityId })
    .orderBy('created_at', 'asc')
}

export async function findAttributeValue(entityKind: CatalogGalleryKind, entityId: string, valueId: string) {
  return db<CompanyAttributeValueRow>(COMPANY_CATALOG_ATTRIBUTE_VALUES)
    .where({ entity_kind: entityKind, entity_id: entityId, id: valueId })
    .first()
}

export async function listVariants(companyProductId: string) {
  return db<CompanyVariantRow>(COMPANY_PRODUCT_VARIANTS)
    .where({ company_product_id: companyProductId })
    .orderBy('created_at', 'asc')
}

export async function findVariant(companyProductId: string, variantId: string) {
  return db<CompanyVariantRow>(COMPANY_PRODUCT_VARIANTS)
    .where({ company_product_id: companyProductId, id: variantId })
    .first()
}

export async function variantNamesByLibraryId(
  pairs: Array<{ companyProductId: string; libraryVariantId: string }>,
): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  const productIds = [...new Set(pairs.map((pair) => pair.companyProductId).filter(Boolean))]
  const libraryIds = [...new Set(pairs.map((pair) => pair.libraryVariantId).filter(Boolean))]
  if (productIds.length === 0 || libraryIds.length === 0) return names
  const rows = await db<CompanyVariantRow>(COMPANY_PRODUCT_VARIANTS)
    .whereIn('company_product_id', productIds)
    .whereIn('library_variant_id', libraryIds)
    .select('company_product_id', 'library_variant_id', 'name')
  for (const row of rows) {
    names.set(`${row.company_product_id}:${row.library_variant_id}`, row.name)
  }
  return names
}

export async function findVariantByLibraryId(companyProductId: string, libraryVariantId: string) {
  return db<CompanyVariantRow>(COMPANY_PRODUCT_VARIANTS)
    .where({ company_product_id: companyProductId, library_variant_id: libraryVariantId })
    .first()
}

export async function listVariantValues(companyVariantIds: string[]) {
  if (companyVariantIds.length === 0) return []
  return db<CompanyVariantValueRow>(COMPANY_PRODUCT_VARIANT_VALUES).whereIn(
    'company_variant_id',
    companyVariantIds,
  )
}

export async function resolveCompanyVariant(
  companyProductId: string,
  variantId: string,
): Promise<{ companyVariantId: string | null; libraryVariantId: string }> {
  const trimmed = variantId.trim()
  const byId = await findVariant(companyProductId, trimmed)
  if (byId) {
    return { companyVariantId: byId.id, libraryVariantId: byId.library_variant_id }
  }
  const byLibrary = await findVariantByLibraryId(companyProductId, trimmed)
  if (byLibrary) {
    return { companyVariantId: byLibrary.id, libraryVariantId: byLibrary.library_variant_id }
  }
  return { companyVariantId: null, libraryVariantId: trimmed }
}
