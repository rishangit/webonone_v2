import { nanoid } from 'nanoid'
import {
  addLibraryCatalogAttributeValue,
  createLibraryCatalogItem,
  getLibraryCatalogDetail,
  listLibraryProductVariants,
  replaceLibraryCatalogAttributes,
  type DataCatalogAttributeLink,
  type DataCatalogDetail,
  type DataProductVariant,
} from '../clients/dataCatalogClient.js'
import { db } from '../models/db.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import * as copiesRepo from '../repositories/companyCatalogCopies.repository.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import {
  isCatalogGalleryKind,
  type CatalogGalleryKind,
  type   UpdateCompanyAttributeValueBody,
  UpdateCompanyVariantAttributeValuesBody,
} from '../schemas/companyCatalogSchemas.js'
import type { CatalogEntityKind } from '../schemas/companyCatalogSchemas.js'

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

async function assertCompanySessionAccess(userId: string, companyId: string): Promise<void> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) return
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin' && membership?.role !== 'member') {
    throw httpError('Company access required', 403)
  }
}

async function assertCompanyAdmin(userId: string, companyId: string): Promise<void> {
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin') {
    throw httpError('Company admin access required', 403)
  }
}

function galleryKind(kind: CatalogEntityKind): CatalogGalleryKind {
  if (!isCatalogGalleryKind(kind)) {
    throw httpError('Attributes are available for products, services, and spaces', 400)
  }
  return kind
}

async function requireItem(companyId: string, kind: CatalogGalleryKind, entityId: string) {
  const row = await catalogRepo.findById(companyId, kind, entityId)
  if (!row) throw httpError('Catalog item not found', 404)
  return row
}

function hhmm(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 5)
  if (value instanceof Date) {
    const hours = String(value.getUTCHours()).padStart(2, '0')
    const minutes = String(value.getUTCMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
  return null
}

export async function ensureLibraryEntityId(
  companyId: string,
  kind: CatalogGalleryKind,
  entityId: string,
  accessToken: string,
): Promise<string> {
  const row = await requireItem(companyId, kind, entityId)
  const existing = typeof row.library_entity_id === 'string' ? row.library_entity_id : null
  if (existing) return existing

  const name = typeof row.name === 'string' && row.name.trim() ? row.name.trim() : 'Untitled'
  const description = typeof row.description === 'string' ? row.description : null
  const body: Record<string, unknown> = { name, description }
  if (kind === 'services') {
    const timeMode = row.time_mode === 'window' ? 'window' : 'duration'
    body.time_mode = timeMode
    if (timeMode === 'duration') {
      const minutes = Number(row.duration_minutes)
      body.duration_minutes = Number.isInteger(minutes) && minutes > 0 ? minutes : 30
    } else {
      body.start_time = hhmm(row.start_time) ?? '09:00'
      body.end_time = hhmm(row.end_time) ?? '17:00'
    }
  }

  const created = await createLibraryCatalogItem(kind, body, accessToken)
  await db(catalogRepo.CATALOG_TABLE_BY_KIND[kind])
    .where({ id: entityId, company_id: companyId })
    .update({ library_entity_id: created.id, updated_at: db.fn.now(3) })
  return created.id
}

async function loadLibraryDetail(
  kind: CatalogGalleryKind,
  libraryEntityId: string,
  accessToken: string,
): Promise<DataCatalogDetail> {
  const detail = await getLibraryCatalogDetail(kind, libraryEntityId, accessToken)
  if (!detail) throw httpError('Library item not found', 404)
  return detail
}

export type CompanyAttributeValueDto = {
  id: string
  libraryValueId: string | null
  valueText: string | null
  valueNumber: number | null
  isDefault: boolean
  usedByVariants: string[]
}

export type CompanyAttributeDto = {
  attributeId: string
  name: string
  description: string | null
  valueType: 'number' | 'text'
  unit: { id: string; name: string; symbol: string } | null
  values: CompanyAttributeValueDto[]
}

type VariantPickUse = {
  company_variant_id: string
  library_attribute_id: string
  library_attribute_value_id: string
  company_attribute_value_id: string | null
  variant_name: string
}

async function listProductVariantUses(
  trx: typeof db,
  companyProductId: string,
): Promise<VariantPickUse[]> {
  const rows = await trx({ pick: copiesRepo.COMPANY_PRODUCT_VARIANT_VALUES })
    .join(
      { variant: copiesRepo.COMPANY_PRODUCT_VARIANTS },
      'variant.id',
      'pick.company_variant_id',
    )
    .where('variant.company_product_id', companyProductId)
    .select(
      'pick.company_variant_id',
      'pick.library_attribute_id',
      'pick.library_attribute_value_id',
      'pick.company_attribute_value_id',
      'variant.name as variant_name',
    )
  return rows as VariantPickUse[]
}

function variantDependenceMessage(subject: 'attribute' | 'value', names: string[]): string {
  const unique = [...new Set(names.filter(Boolean))]
  const listed = unique.map((name) => `"${name}"`).join(', ')
  const noun = unique.length === 1 ? 'variant' : 'variants'
  const label = subject === 'value' ? 'This attribute value' : 'This attribute'
  return `${label} is used by ${noun} ${listed}. Remove ${unique.length === 1 ? 'that variant' : 'those variants'} first.`
}

function variantNamesForStoredValue(
  row: copiesRepo.CompanyAttributeValueRow,
  uses: VariantPickUse[],
): string[] {
  const names = uses
    .filter(
      (pick) =>
        pick.company_attribute_value_id === row.id ||
        (row.library_value_id != null &&
          pick.library_attribute_value_id === row.library_value_id),
    )
    .map((pick) => pick.variant_name)
  return [...new Set(names.filter(Boolean))]
}

function mapStoredValues(
  rows: copiesRepo.CompanyAttributeValueRow[],
  variantUses: VariantPickUse[],
): CompanyAttributeValueDto[] {
  return rows.map((row) => ({
    id: row.id,
    libraryValueId: row.library_value_id,
    valueText: row.value_text,
    valueNumber: toNumber(row.value_number),
    isDefault: Boolean(row.is_default),
    usedByVariants: variantNamesForStoredValue(row, variantUses),
  }))
}

function hydrateAttributes(
  links: Array<{ library_attribute_id: string }>,
  values: copiesRepo.CompanyAttributeValueRow[],
  library: DataCatalogDetail | null,
  variantUses: VariantPickUse[],
): CompanyAttributeDto[] {
  const libraryById = new Map(
    (library?.attributes ?? []).map((attr) => [attr.attributeId, attr]),
  )
  return links.map((link) => {
    const source = libraryById.get(link.library_attribute_id)
    const ownValues = values.filter((row) => row.library_attribute_id === link.library_attribute_id)
    const description =
      typeof source?.description === 'string' && source.description.trim().length > 0
        ? source.description.trim()
        : null
    return {
      attributeId: link.library_attribute_id,
      name: source?.name ?? link.library_attribute_id,
      description,
      valueType: source?.valueType === 'number' ? 'number' : 'text',
      unit: source?.unit ?? null,
      values: mapStoredValues(ownValues, variantUses),
    }
  })
}

export async function listAttributes(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  accessToken: string,
) {
  await assertCompanySessionAccess(userId, companyId)
  const gallery = galleryKind(kind)
  const row = await requireItem(companyId, gallery, entityId)
  const links = await copiesRepo.listAttributeLinks(gallery, entityId)
  const values = await copiesRepo.listAttributeValues(gallery, entityId)
  const libraryId = typeof row.library_entity_id === 'string' ? row.library_entity_id : null
  let library: DataCatalogDetail | null = null
  if (libraryId) {
    try {
      library = await getLibraryCatalogDetail(gallery, libraryId, accessToken)
    } catch {
      library = null
    }
  }
  const variantUses =
    gallery === 'products' ? await listProductVariantUses(db, entityId) : []
  return {
    libraryEntityId: libraryId,
    attributes: hydrateAttributes(links, values, library, variantUses),
  }
}

async function insertAttributeCopy(
  trx: typeof db,
  input: {
    companyId: string
    kind: CatalogGalleryKind
    entityId: string
    attribute: DataCatalogAttributeLink
    valueIds?: Set<string>
  },
) {
  const existingLink = await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTES)
    .where({
      entity_kind: input.kind,
      entity_id: input.entityId,
      library_attribute_id: input.attribute.attributeId,
    })
    .first()
  if (!existingLink) {
    await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTES).insert({
      company_id: input.companyId,
      entity_kind: input.kind,
      entity_id: input.entityId,
      library_attribute_id: input.attribute.attributeId,
      created_at: trx.fn.now(3),
    })
  }

  const values = input.attribute.values.filter((value) =>
    input.valueIds ? input.valueIds.has(value.id) : true,
  )
  for (const value of values) {
    const existing = await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
      .where({
        entity_kind: input.kind,
        entity_id: input.entityId,
        library_value_id: value.id,
      })
      .first()
    if (existing) continue
    const siblingCount = await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
      .where({
        entity_kind: input.kind,
        entity_id: input.entityId,
        library_attribute_id: input.attribute.attributeId,
      })
      .count({ count: '*' })
      .first()
    const hasDefault = Number(siblingCount?.count ?? 0) > 0
      ? Boolean(
          await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
            .where({
              entity_kind: input.kind,
              entity_id: input.entityId,
              library_attribute_id: input.attribute.attributeId,
              is_default: true,
            })
            .first(),
        )
      : false
    await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES).insert({
      id: nanoid(),
      company_id: input.companyId,
      entity_kind: input.kind,
      entity_id: input.entityId,
      library_attribute_id: input.attribute.attributeId,
      library_value_id: value.id,
      value_text: value.valueText,
      value_number: value.valueNumber,
      is_default: hasDefault ? false : value.isDefault || Number(siblingCount?.count ?? 0) === 0,
      created_at: trx.fn.now(3),
      updated_at: trx.fn.now(3),
    })
  }
}

async function attachMissingLibraryAttributes(
  kind: CatalogGalleryKind,
  libraryEntityId: string,
  attributeIds: string[],
  accessToken: string,
): Promise<DataCatalogDetail> {
  let detail = await loadLibraryDetail(kind, libraryEntityId, accessToken)
  const present = new Set((detail.attributes ?? []).map((attr) => attr.attributeId))
  const missing = attributeIds.filter((id) => !present.has(id))
  if (missing.length === 0) return detail
  const nextIds = [...present, ...missing]
  detail = await replaceLibraryCatalogAttributes(kind, libraryEntityId, nextIds, accessToken)
  return detail
}

export async function attachAttributesToLibrary(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  attributeIds: string[],
  accessToken: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const gallery = galleryKind(kind)
  await requireItem(companyId, gallery, entityId)
  const libraryEntityId = await ensureLibraryEntityId(companyId, gallery, entityId, accessToken)
  const detail = await attachMissingLibraryAttributes(
    gallery,
    libraryEntityId,
    attributeIds,
    accessToken,
  )
  return {
    libraryEntityId,
    attributes: detail.attributes ?? [],
  }
}

export async function copyAttributesFromLibrary(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  attributeIds: string[],
  accessToken: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const gallery = galleryKind(kind)
  await requireItem(companyId, gallery, entityId)
  const libraryEntityId = await ensureLibraryEntityId(companyId, gallery, entityId, accessToken)
  const detail = await attachMissingLibraryAttributes(
    gallery,
    libraryEntityId,
    attributeIds,
    accessToken,
  )
  const selected = (detail.attributes ?? []).filter((attr) => attributeIds.includes(attr.attributeId))
  if (selected.length !== new Set(attributeIds).size) {
    throw httpError('One or more library attributes were not found', 404)
  }

  await db.transaction(async (trx) => {
    for (const attribute of selected) {
      await insertAttributeCopy(trx, {
        companyId,
        kind: gallery,
        entityId,
        attribute,
      })
    }
  })

  return listAttributes(userId, companyId, gallery, entityId, accessToken)
}

export async function deleteAttribute(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  attributeId: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const gallery = galleryKind(kind)
  await requireItem(companyId, gallery, entityId)

  await db.transaction(async (trx) => {
    if (gallery === 'products') {
      const uses = (await listProductVariantUses(trx, entityId)).filter(
        (row) => row.library_attribute_id === attributeId,
      )
      if (uses.length > 0) {
        throw httpError(variantDependenceMessage('attribute', uses.map((row) => row.variant_name)), 409)
      }
    }
    await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
      .where({
        entity_kind: gallery,
        entity_id: entityId,
        library_attribute_id: attributeId,
      })
      .delete()
    const removed = await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTES)
      .where({
        entity_kind: gallery,
        entity_id: entityId,
        library_attribute_id: attributeId,
      })
      .delete()
    if (!removed) throw httpError('Attribute not found', 404)
  })
}

export async function copyAttributeValuesFromLibrary(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  libraryValueIds: string[],
  accessToken: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const gallery = galleryKind(kind)
  await requireItem(companyId, gallery, entityId)
  const libraryEntityId = await ensureLibraryEntityId(companyId, gallery, entityId, accessToken)
  const detail = await loadLibraryDetail(gallery, libraryEntityId, accessToken)
  const wanted = new Set(libraryValueIds)
  const matches: Array<{ attribute: DataCatalogAttributeLink; valueIds: Set<string> }> = []
  let found = 0
  for (const attribute of detail.attributes ?? []) {
    const valueIds = new Set(
      attribute.values.filter((value) => wanted.has(value.id)).map((value) => value.id),
    )
    if (valueIds.size === 0) continue
    found += valueIds.size
    matches.push({ attribute, valueIds })
  }
  if (found !== wanted.size) {
    throw httpError('One or more library attribute values were not found', 404)
  }

  await db.transaction(async (trx) => {
    for (const match of matches) {
      await insertAttributeCopy(trx, {
        companyId,
        kind: gallery,
        entityId,
        attribute: match.attribute,
        valueIds: match.valueIds,
      })
    }
  })

  return listAttributes(userId, companyId, gallery, entityId, accessToken)
}

export async function createAttributeValueInLibrary(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  attributeId: string,
  body: UpdateCompanyAttributeValueBody,
  accessToken: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const gallery = galleryKind(kind)
  await requireItem(companyId, gallery, entityId)
  const libraryEntityId = await ensureLibraryEntityId(companyId, gallery, entityId, accessToken)
  const before = await loadLibraryDetail(gallery, libraryEntityId, accessToken)
  const beforeIds = new Set(
    (before.attributes ?? [])
      .find((attr) => attr.attributeId === attributeId)
      ?.values.map((value) => value.id) ?? [],
  )
  if (!(before.attributes ?? []).some((attr) => attr.attributeId === attributeId)) {
    await attachMissingLibraryAttributes(gallery, libraryEntityId, [attributeId], accessToken)
  }
  const after = await addLibraryCatalogAttributeValue(
    gallery,
    libraryEntityId,
    attributeId,
    {
      value_text: body.valueText ?? null,
      value_number: body.valueNumber ?? null,
    },
    accessToken,
  )
  const createdIds = (after.attributes ?? [])
    .find((attr) => attr.attributeId === attributeId)
    ?.values.map((value) => value.id)
    .filter((id) => !beforeIds.has(id)) ?? []
  if (createdIds.length === 0) {
    throw httpError('Library attribute value was not created', 502)
  }
  return copyAttributeValuesFromLibrary(
    userId,
    companyId,
    gallery,
    entityId,
    createdIds,
    accessToken,
  )
}

export async function updateAttributeValue(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  valueId: string,
  body: UpdateCompanyAttributeValueBody,
) {
  await assertCompanyAdmin(userId, companyId)
  const gallery = galleryKind(kind)
  await requireItem(companyId, gallery, entityId)
  const updated = await db(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
    .where({ entity_kind: gallery, entity_id: entityId, id: valueId })
    .update({
      value_text: body.valueText ?? null,
      value_number: body.valueNumber ?? null,
      updated_at: db.fn.now(3),
    })
  if (!updated) throw httpError('Attribute value not found', 404)
}

export async function setAttributeValueDefault(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  valueId: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const gallery = galleryKind(kind)
  await requireItem(companyId, gallery, entityId)
  const value = await copiesRepo.findAttributeValue(gallery, entityId, valueId)
  if (!value) throw httpError('Attribute value not found', 404)
  await db.transaction(async (trx) => {
    await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
      .where({
        entity_kind: gallery,
        entity_id: entityId,
        library_attribute_id: value.library_attribute_id,
      })
      .update({ is_default: false, updated_at: trx.fn.now(3) })
    await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
      .where({ id: valueId })
      .update({ is_default: true, updated_at: trx.fn.now(3) })
  })
}

export async function deleteAttributeValue(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  entityId: string,
  valueId: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const gallery = galleryKind(kind)
  await requireItem(companyId, gallery, entityId)
  const value = await copiesRepo.findAttributeValue(gallery, entityId, valueId)
  if (!value) throw httpError('Attribute value not found', 404)

  await db.transaction(async (trx) => {
    if (gallery === 'products') {
      const uses = (await listProductVariantUses(trx, entityId)).filter(
        (row) =>
          row.company_attribute_value_id === valueId ||
          (value.library_value_id != null &&
            row.library_attribute_value_id === value.library_value_id),
      )
      if (uses.length > 0) {
        throw httpError(variantDependenceMessage('value', uses.map((row) => row.variant_name)), 409)
      }
    }
    const removed = await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
      .where({ entity_kind: gallery, entity_id: entityId, id: valueId })
      .delete()
    if (!removed) throw httpError('Attribute value not found', 404)
  })
}

export type CompanyVariantValueDto = {
  attributeId: string
  attributeName: string
  attributeValueId: string
  libraryValueId: string
  valueText: string | null
  valueNumber: number | null
  valueType: 'number' | 'text'
  unitSymbol: string | null
}

export type CompanyVariantDto = {
  id: string
  libraryVariantId: string
  productId: string
  name: string
  sku: string
  isDefault: boolean
  values: CompanyVariantValueDto[]
  createdAt: string
  updatedAt: string
}

function iso(value: Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

async function mapVariants(
  companyProductId: string,
  rows: copiesRepo.CompanyVariantRow[],
  library: DataCatalogDetail | null,
): Promise<CompanyVariantDto[]> {
  const picks = await copiesRepo.listVariantValues(rows.map((row) => row.id))
  const valueRows = await copiesRepo.listAttributeValues('products', companyProductId)
  const valueById = new Map(valueRows.map((row) => [row.id, row]))
  const valueByLibrary = new Map(
    valueRows
      .filter((row) => row.library_value_id)
      .map((row) => [row.library_value_id as string, row]),
  )
  const libraryAttr = new Map((library?.attributes ?? []).map((attr) => [attr.attributeId, attr]))

  return rows.map((row) => ({
    id: row.id,
    libraryVariantId: row.library_variant_id,
    productId: companyProductId,
    name: row.name,
    sku: row.sku,
    isDefault: Boolean(row.is_default),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    values: picks
      .filter((pick) => pick.company_variant_id === row.id)
      .map((pick) => {
        const stored =
          (pick.company_attribute_value_id
            ? valueById.get(pick.company_attribute_value_id)
            : undefined) ?? valueByLibrary.get(pick.library_attribute_value_id)
        const source = libraryAttr.get(pick.library_attribute_id)
        return {
          attributeId: pick.library_attribute_id,
          attributeName: source?.name ?? pick.library_attribute_id,
          attributeValueId: stored?.id ?? pick.library_attribute_value_id,
          libraryValueId: pick.library_attribute_value_id,
          valueText: stored?.value_text ?? null,
          valueNumber: toNumber(stored?.value_number),
          valueType: source?.valueType === 'number' ? 'number' : 'text',
          unitSymbol: source?.unit?.symbol ?? null,
        }
      }),
  }))
}

export async function listVariants(
  userId: string,
  companyId: string,
  companyProductId: string,
  accessToken: string,
) {
  await assertCompanySessionAccess(userId, companyId)
  const row = await requireItem(companyId, 'products', companyProductId)
  const variants = await copiesRepo.listVariants(companyProductId)
  const libraryId = typeof row.library_entity_id === 'string' ? row.library_entity_id : null
  let library: DataCatalogDetail | null = null
  if (libraryId) {
    try {
      library = await getLibraryCatalogDetail('products', libraryId, accessToken)
    } catch {
      library = null
    }
  }
  return {
    libraryEntityId: libraryId,
    items: await mapVariants(companyProductId, variants, library),
  }
}

export async function getVariant(
  userId: string,
  companyId: string,
  companyProductId: string,
  variantId: string,
  accessToken: string,
) {
  const result = await listVariants(userId, companyId, companyProductId, accessToken)
  const variant = result.items.find((item) => item.id === variantId || item.libraryVariantId === variantId)
  if (!variant) throw httpError('Variant not found', 404)
  return variant
}

async function copyVariantRow(
  trx: typeof db,
  input: {
    companyId: string
    companyProductId: string
    source: DataProductVariant
    library: DataCatalogDetail
  },
) {
  const existing = await trx(copiesRepo.COMPANY_PRODUCT_VARIANTS)
    .where({
      company_product_id: input.companyProductId,
      library_variant_id: input.source.id,
    })
    .first()
  if (existing) return existing.id as string

  const skuTaken = await trx(copiesRepo.COMPANY_PRODUCT_VARIANTS)
    .where({ company_product_id: input.companyProductId, sku: input.source.sku })
    .first()
  if (skuTaken) {
    throw httpError(`SKU ${input.source.sku} is already used on this product`, 409)
  }

  for (const pick of input.source.values) {
    if (!pick.attributeId || !pick.attributeValueId) {
      throw httpError(`Variant ${input.source.name} is missing an attribute value`, 409)
    }
    await insertAttributeCopy(trx, {
      companyId: input.companyId,
      kind: 'products',
      entityId: input.companyProductId,
      attribute: attributeForVariantPick(input.library, pick),
      valueIds: new Set([pick.attributeValueId]),
    })
  }

  const hasDefault = await trx(copiesRepo.COMPANY_PRODUCT_VARIANTS)
    .where({ company_product_id: input.companyProductId, is_default: true })
    .first()
  const id = nanoid()
  await trx(copiesRepo.COMPANY_PRODUCT_VARIANTS).insert({
    id,
    company_id: input.companyId,
    company_product_id: input.companyProductId,
    library_variant_id: input.source.id,
    name: input.source.name,
    sku: input.source.sku,
    is_default: hasDefault ? false : input.source.isDefault,
    created_at: trx.fn.now(3),
    updated_at: trx.fn.now(3),
  })

  const companyValues = await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES).where({
    entity_kind: 'products',
    entity_id: input.companyProductId,
  })
  const byLibraryValue = new Map(
    companyValues
      .filter((row) => row.library_value_id)
      .map((row) => [row.library_value_id as string, row.id as string]),
  )
  if (input.source.values.length > 0) {
    await trx(copiesRepo.COMPANY_PRODUCT_VARIANT_VALUES).insert(
      input.source.values.map((pick) => ({
        company_variant_id: id,
        library_attribute_id: pick.attributeId,
        library_attribute_value_id: pick.attributeValueId,
        company_attribute_value_id: byLibraryValue.get(pick.attributeValueId) ?? null,
      })),
    )
  }
  return id
}

export async function copyVariantsFromLibrary(
  userId: string,
  companyId: string,
  companyProductId: string,
  libraryVariantIds: string[],
  accessToken: string,
) {
  await assertCompanyAdmin(userId, companyId)
  await requireItem(companyId, 'products', companyProductId)
  const libraryEntityId = await ensureLibraryEntityId(
    companyId,
    'products',
    companyProductId,
    accessToken,
  )
  const [library, variants] = await Promise.all([
    loadLibraryDetail('products', libraryEntityId, accessToken),
    listLibraryProductVariants(libraryEntityId, accessToken),
  ])
  const wanted = new Set(libraryVariantIds)
  const selected = variants.filter((variant) => wanted.has(variant.id))
  if (selected.length !== wanted.size) {
    throw httpError('One or more library variants were not found', 404)
  }

  await db.transaction(async (trx) => {
    for (const source of selected) {
      await copyVariantRow(trx, {
        companyId,
        companyProductId,
        source,
        library,
      })
    }
  })

  return listVariants(userId, companyId, companyProductId, accessToken)
}

function variantCombinationKey(libraryValueIds: string[]): string {
  return [...libraryValueIds].sort().join('|')
}

function resolveLibraryValueIdsForVariant(
  attributes: CompanyAttributeDto[],
  requested: Set<string>,
): string[] {
  const libraryValueIds: string[] = []
  for (const attribute of attributes) {
    if (attribute.values.length === 0) continue
    if (attribute.values.length === 1) {
      const only = attribute.values[0]
      const libraryId = only?.libraryValueId
      if (!libraryId) {
        throw httpError(`Attribute "${attribute.name}" is missing a library value link`, 409)
      }
      libraryValueIds.push(libraryId)
      continue
    }
    const selected = attribute.values.find(
      (value) => value.libraryValueId != null && requested.has(value.libraryValueId),
    )
    if (!selected?.libraryValueId) {
      throw httpError(`Select a value for attribute "${attribute.name}"`, 400)
    }
    libraryValueIds.push(selected.libraryValueId)
  }
  return libraryValueIds
}

async function assertUniqueVariantCombination(
  companyProductId: string,
  excludeVariantId: string,
  libraryValueIds: string[],
): Promise<void> {
  const nextKey = variantCombinationKey(libraryValueIds)
  const variants = await copiesRepo.listVariants(companyProductId)
  const picks = await copiesRepo.listVariantValues(variants.map((row) => row.id))
  for (const variant of variants) {
    if (variant.id === excludeVariantId) continue
    const variantPicks = picks.filter((pick) => pick.company_variant_id === variant.id)
    const key = variantCombinationKey(variantPicks.map((pick) => pick.library_attribute_value_id))
    if (key === nextKey) {
      throw httpError('A variant with this attribute combination already exists.', 409)
    }
  }
}

export async function updateVariantAttributeValues(
  userId: string,
  companyId: string,
  companyProductId: string,
  variantId: string,
  body: UpdateCompanyVariantAttributeValuesBody,
  accessToken: string,
) {
  await assertCompanyAdmin(userId, companyId)
  await requireItem(companyId, 'products', companyProductId)
  const variant =
    (await copiesRepo.findVariant(companyProductId, variantId)) ??
    (await copiesRepo.findVariantByLibraryId(companyProductId, variantId))
  if (!variant) throw httpError('Variant not found', 404)

  const { attributes } = await listAttributes(userId, companyId, 'products', companyProductId, accessToken)
  const requested = new Set(body.libraryValueIds)
  const libraryValueIds = resolveLibraryValueIdsForVariant(attributes, requested)
  await assertUniqueVariantCombination(companyProductId, variant.id, libraryValueIds)

  const libraryEntityId = await ensureLibraryEntityId(
    companyId,
    'products',
    companyProductId,
    accessToken,
  )
  const library = await loadLibraryDetail('products', libraryEntityId, accessToken)

  await db.transaction(async (trx) => {
    for (const libraryValueId of libraryValueIds) {
      const libraryAttribute = (library.attributes ?? []).find((attr) =>
        attr.values.some((value) => value.id === libraryValueId),
      )
      if (!libraryAttribute) {
        throw httpError('One or more attribute values were not found on the library product', 404)
      }
      await insertAttributeCopy(trx, {
        companyId,
        kind: 'products',
        entityId: companyProductId,
        attribute: libraryAttribute,
        valueIds: new Set([libraryValueId]),
      })
    }

    await trx(copiesRepo.COMPANY_PRODUCT_VARIANT_VALUES)
      .where({ company_variant_id: variant.id })
      .delete()

    const companyValues = await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES).where({
      entity_kind: 'products',
      entity_id: companyProductId,
    })
    const byLibraryValue = new Map(
      companyValues
        .filter((row) => row.library_value_id)
        .map((row) => [row.library_value_id as string, row.id as string]),
    )

    const picks = libraryValueIds.map((libraryValueId) => {
      const libraryAttribute = (library.attributes ?? []).find((attr) =>
        attr.values.some((value) => value.id === libraryValueId),
      )
      if (!libraryAttribute) {
        throw httpError('One or more attribute values were not found on the library product', 404)
      }
      return {
        company_variant_id: variant.id,
        library_attribute_id: libraryAttribute.attributeId,
        library_attribute_value_id: libraryValueId,
        company_attribute_value_id: byLibraryValue.get(libraryValueId) ?? null,
      }
    })

    if (picks.length > 0) {
      await trx(copiesRepo.COMPANY_PRODUCT_VARIANT_VALUES).insert(picks)
    }

    await trx(copiesRepo.COMPANY_PRODUCT_VARIANTS)
      .where({ id: variant.id })
      .update({ updated_at: trx.fn.now(3) })
  })

  return getVariant(userId, companyId, companyProductId, variant.id, accessToken)
}

export async function deleteVariant(
  userId: string,
  companyId: string,
  companyProductId: string,
  variantId: string,
) {
  await assertCompanyAdmin(userId, companyId)
  await requireItem(companyId, 'products', companyProductId)
  const variant =
    (await copiesRepo.findVariant(companyProductId, variantId)) ??
    (await copiesRepo.findVariantByLibraryId(companyProductId, variantId))
  if (!variant) throw httpError('Variant not found', 404)
  if (Boolean(variant.is_default)) {
    throw httpError('The default variant cannot be removed', 400)
  }
  const stock = await db('company_product_stocks')
    .where({ company_product_id: companyProductId, company_variant_id: variant.id })
    .first()
  if (stock) throw httpError('Remove stock batches before removing this variant', 409)

  await db.transaction(async (trx) => {
    const picks = await trx(copiesRepo.COMPANY_PRODUCT_VARIANT_VALUES).where({
      company_variant_id: variant.id,
    })
    await trx(copiesRepo.COMPANY_PRODUCT_VARIANTS).where({ id: variant.id }).delete()
    await removeVariantAttributeValues(trx, companyProductId, picks as copiesRepo.CompanyVariantValueRow[])
  })
}

function attributeForVariantPick(
  library: DataCatalogDetail,
  pick: DataProductVariant['values'][number],
): DataCatalogAttributeLink {
  const value = {
    id: pick.attributeValueId,
    valueText: pick.valueText,
    valueNumber: pick.valueNumber,
    isDefault: false,
  }
  const found = (library.attributes ?? []).find((attr) => attr.attributeId === pick.attributeId)
  if (!found) {
    return {
      attributeId: pick.attributeId,
      name: pick.attributeName || pick.attributeId,
      description: null,
      valueType: pick.valueType === 'number' ? 'number' : 'text',
      unit: null,
      values: [value],
    }
  }
  if (found.values.some((entry) => entry.id === value.id)) return found
  return { ...found, values: [...found.values, value] }
}

async function removeVariantAttributeValues(
  trx: typeof db,
  companyProductId: string,
  picks: copiesRepo.CompanyVariantValueRow[],
) {
  if (picks.length === 0) return
  const remaining = await listProductVariantUses(trx, companyProductId)
  const usedCompanyValueIds = new Set(
    remaining.map((row) => row.company_attribute_value_id).filter((id): id is string => Boolean(id)),
  )
  const usedLibraryValueIds = new Set(remaining.map((row) => row.library_attribute_value_id))

  for (const pick of picks) {
    const stillUsed =
      (pick.company_attribute_value_id != null &&
        usedCompanyValueIds.has(pick.company_attribute_value_id)) ||
      usedLibraryValueIds.has(pick.library_attribute_value_id)
    if (stillUsed) continue
    if (pick.company_attribute_value_id) {
      await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
        .where({
          id: pick.company_attribute_value_id,
          entity_kind: 'products',
          entity_id: companyProductId,
        })
        .delete()
    } else {
      await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
        .where({
          entity_kind: 'products',
          entity_id: companyProductId,
          library_value_id: pick.library_attribute_value_id,
        })
        .delete()
    }
  }

  for (const attributeId of new Set(picks.map((pick) => pick.library_attribute_id))) {
    const valueLeft = await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTE_VALUES)
      .where({
        entity_kind: 'products',
        entity_id: companyProductId,
        library_attribute_id: attributeId,
      })
      .first()
    const stillPicked = remaining.some((row) => row.library_attribute_id === attributeId)
    if (!valueLeft && !stillPicked) {
      await trx(copiesRepo.COMPANY_CATALOG_ATTRIBUTES)
        .where({
          entity_kind: 'products',
          entity_id: companyProductId,
          library_attribute_id: attributeId,
        })
        .delete()
    }
  }
}
