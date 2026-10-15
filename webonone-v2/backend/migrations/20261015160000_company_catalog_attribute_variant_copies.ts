import { nanoid } from 'nanoid'
import type { Knex } from 'knex'

const GALLERY_KINDS = ['products', 'services', 'spaces'] as const

async function schemaTableExists(knex: Knex, schema: string, table: string): Promise<boolean> {
  const [rows] = await knex.raw(
    `SELECT 1 AS ok
     FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?
     LIMIT 1`,
    [schema, table],
  )
  return Array.isArray(rows) && rows.length > 0
}

function asRows<T>(result: unknown): T[] {
  const rows = Array.isArray(result) ? result[0] : result
  return Array.isArray(rows) ? (rows as T[]) : []
}

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('company_catalog_entity_attributes'))) {
    await knex.schema.createTable('company_catalog_entity_attributes', (table) => {
      table.string('company_id', 21).notNullable()
      table.string('entity_kind', 16).notNullable()
      table.string('entity_id', 21).notNullable()
      table.string('library_attribute_id', 21).notNullable()
      table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
      table.primary(['entity_kind', 'entity_id', 'library_attribute_id'])
      table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
      table.index(['company_id', 'entity_kind', 'entity_id'], 'company_catalog_entity_attributes_company_idx')
    })
  }

  if (!(await knex.schema.hasTable('company_catalog_entity_attribute_values'))) {
    await knex.schema.createTable('company_catalog_entity_attribute_values', (table) => {
      table.string('id', 21).primary()
      table.string('company_id', 21).notNullable()
      table.string('entity_kind', 16).notNullable()
      table.string('entity_id', 21).notNullable()
      table.string('library_attribute_id', 21).notNullable()
      table.string('library_value_id', 21).nullable()
      table.text('value_text').nullable()
      table.decimal('value_number', 18, 6).nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
      table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
      table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
      table.index(
        ['entity_kind', 'entity_id', 'library_attribute_id'],
        'company_catalog_entity_attribute_values_entity_idx',
      )
      table.unique(['entity_kind', 'entity_id', 'library_value_id'], {
        indexName: 'company_catalog_attr_values_library_value_unique',
      })
    })
  }

  if (!(await knex.schema.hasTable('company_product_variants'))) {
    await knex.schema.createTable('company_product_variants', (table) => {
      table.string('id', 21).primary()
      table.string('company_id', 21).notNullable()
      table.string('company_product_id', 21).notNullable()
      table.string('library_variant_id', 21).notNullable()
      table.string('name', 255).notNullable()
      table.string('sku', 255).notNullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
      table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
      table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
      table
        .foreign('company_product_id')
        .references('id')
        .inTable('company_products')
        .onDelete('CASCADE')
      table.unique(['company_product_id', 'library_variant_id'], {
        indexName: 'company_product_variants_library_unique',
      })
      table.unique(['company_product_id', 'sku'], {
        indexName: 'company_product_variants_sku_unique',
      })
    })
  }

  if (await knex.schema.hasTable('company_product_variant_values')) {
    const [constraintRows] = await knex.raw(
      `SELECT 1 AS ok
       FROM information_schema.table_constraints
       WHERE table_schema = DATABASE()
         AND table_name = 'company_product_variant_values'
         AND constraint_name = 'company_variant_values_attr_value_fk'
       LIMIT 1`,
    )
    if (!Array.isArray(constraintRows) || constraintRows.length === 0) {
      await knex.schema.dropTable('company_product_variant_values')
    }
  }

  if (!(await knex.schema.hasTable('company_product_variant_values'))) {
    await knex.schema.createTable('company_product_variant_values', (table) => {
      table.string('company_variant_id', 21).notNullable()
      table.string('library_attribute_id', 21).notNullable()
      table.string('library_attribute_value_id', 21).notNullable()
      table.string('company_attribute_value_id', 21).nullable()
      table.primary(['company_variant_id', 'library_attribute_id'])
      table
        .foreign('company_variant_id')
        .references('id')
        .inTable('company_product_variants')
        .onDelete('CASCADE')
      table
        .foreign('company_attribute_value_id', 'company_variant_values_attr_value_fk')
        .references('id')
        .inTable('company_catalog_entity_attribute_values')
        .onDelete('SET NULL')
    })
  }

  if (
    (await knex.schema.hasTable('company_product_stocks')) &&
    !(await knex.schema.hasColumn('company_product_stocks', 'company_variant_id'))
  ) {
    await knex.schema.alterTable('company_product_stocks', (table) => {
      table.string('company_variant_id', 21).nullable()
      table
        .foreign('company_variant_id')
        .references('id')
        .inTable('company_product_variants')
        .onDelete('SET NULL')
      table.index(
        ['company_product_id', 'company_variant_id'],
        'company_product_stocks_company_variant_idx',
      )
    })
  }

  if (
    (await knex.schema.hasTable('company_product_variant_stock_limits')) &&
    !(await knex.schema.hasColumn('company_product_variant_stock_limits', 'company_variant_id'))
  ) {
    await knex.schema.alterTable('company_product_variant_stock_limits', (table) => {
      table.string('company_variant_id', 21).nullable()
      table
        .foreign('company_variant_id')
        .references('id')
        .inTable('company_product_variants')
        .onDelete('SET NULL')
    })
  }

  await backfillFromLibrary(knex)
  await backfillCustomJsonAttributes(knex)
  await linkStocksToCompanyVariants(knex)
}

async function backfillFromLibrary(knex: Knex): Promise<void> {
  const hasValues = await schemaTableExists(
    knex,
    'webonone_data',
    'data_catalog_entity_attribute_values',
  )
  const hasAttributes = await schemaTableExists(knex, 'webonone_data', 'data_catalog_entity_attributes')
  if (!hasAttributes || !hasValues) return

  for (const kind of GALLERY_KINDS) {
    const table =
      kind === 'products' ? 'company_products' : kind === 'services' ? 'company_services' : 'company_spaces'
    await knex.raw(
      `
      INSERT IGNORE INTO company_catalog_entity_attributes
        (company_id, entity_kind, entity_id, library_attribute_id, created_at)
      SELECT cp.company_id, ?, cp.id, src.attribute_id, NOW(3)
      FROM ${table} cp
      INNER JOIN webonone_data.data_catalog_entity_attributes src
        ON src.entity_kind = ?
       AND src.entity_id COLLATE utf8mb4_unicode_ci = cp.library_entity_id COLLATE utf8mb4_unicode_ci
      WHERE cp.library_entity_id IS NOT NULL
      `,
      [kind, kind],
    )
  }

  const valueRows = asRows<{
    company_id: string
    entity_kind: string
    entity_id: string
    library_attribute_id: string
    library_value_id: string
    value_text: string | null
    value_number: string | number | null
    is_default: number | boolean
  }>(
    await knex.raw(`
      SELECT cp.company_id, 'products' AS entity_kind, cp.id AS entity_id,
             src.attribute_id AS library_attribute_id, src.id AS library_value_id,
             src.value_text, src.value_number, src.is_default
      FROM company_products cp
      INNER JOIN webonone_data.data_catalog_entity_attribute_values src
        ON src.entity_kind = 'products'
       AND src.entity_id COLLATE utf8mb4_unicode_ci = cp.library_entity_id COLLATE utf8mb4_unicode_ci
      WHERE cp.library_entity_id IS NOT NULL
      UNION ALL
      SELECT cp.company_id, 'services', cp.id, src.attribute_id, src.id, src.value_text, src.value_number, src.is_default
      FROM company_services cp
      INNER JOIN webonone_data.data_catalog_entity_attribute_values src
        ON src.entity_kind = 'services'
       AND src.entity_id COLLATE utf8mb4_unicode_ci = cp.library_entity_id COLLATE utf8mb4_unicode_ci
      WHERE cp.library_entity_id IS NOT NULL
      UNION ALL
      SELECT cp.company_id, 'spaces', cp.id, src.attribute_id, src.id, src.value_text, src.value_number, src.is_default
      FROM company_spaces cp
      INNER JOIN webonone_data.data_catalog_entity_attribute_values src
        ON src.entity_kind = 'spaces'
       AND src.entity_id COLLATE utf8mb4_unicode_ci = cp.library_entity_id COLLATE utf8mb4_unicode_ci
      WHERE cp.library_entity_id IS NOT NULL
    `),
  )

  const valueIdByKey = new Map<string, string>()
  const valueInserts = valueRows.map((row) => {
    const id = nanoid()
    valueIdByKey.set(`${row.entity_kind}:${row.entity_id}:${row.library_value_id}`, id)
    return {
      id,
      company_id: row.company_id,
      entity_kind: row.entity_kind,
      entity_id: row.entity_id,
      library_attribute_id: row.library_attribute_id,
      library_value_id: row.library_value_id,
      value_text: row.value_text,
      value_number: row.value_number,
      is_default: Boolean(row.is_default),
      created_at: knex.fn.now(3),
      updated_at: knex.fn.now(3),
    }
  })
  await insertChunks(knex, 'company_catalog_entity_attribute_values', valueInserts)

  const hasVariants = await schemaTableExists(knex, 'webonone_data', 'data_product_variants')
  if (!hasVariants) return

  const variantRows = asRows<{
    company_id: string
    company_product_id: string
    library_variant_id: string
    name: string
    sku: string
    is_default: number | boolean
  }>(
    await knex.raw(`
      SELECT cp.company_id, cp.id AS company_product_id, src.id AS library_variant_id,
             src.name, src.sku, src.is_default
      FROM company_products cp
      INNER JOIN webonone_data.data_product_variants src
        ON src.product_id COLLATE utf8mb4_unicode_ci = cp.library_entity_id COLLATE utf8mb4_unicode_ci
      WHERE cp.library_entity_id IS NOT NULL
    `),
  )

  const companyVariantByLibrary = new Map<string, string>()
  const variantInserts = variantRows.map((row) => {
    const id = nanoid()
    companyVariantByLibrary.set(`${row.company_product_id}:${row.library_variant_id}`, id)
    return {
      id,
      company_id: row.company_id,
      company_product_id: row.company_product_id,
      library_variant_id: row.library_variant_id,
      name: row.name,
      sku: row.sku,
      is_default: Boolean(row.is_default),
      created_at: knex.fn.now(3),
      updated_at: knex.fn.now(3),
    }
  })
  await insertChunks(knex, 'company_product_variants', variantInserts)

  const hasVariantValues = await schemaTableExists(knex, 'webonone_data', 'data_product_variant_values')
  if (!hasVariantValues) return

  const pickRows = asRows<{
    company_product_id: string
    library_variant_id: string
    library_attribute_id: string
    library_attribute_value_id: string
  }>(
    await knex.raw(`
      SELECT cp.id AS company_product_id, src.variant_id AS library_variant_id,
             src.attribute_id AS library_attribute_id, src.attribute_value_id AS library_attribute_value_id
      FROM company_products cp
      INNER JOIN webonone_data.data_product_variants dv
        ON dv.product_id COLLATE utf8mb4_unicode_ci = cp.library_entity_id COLLATE utf8mb4_unicode_ci
      INNER JOIN webonone_data.data_product_variant_values src ON src.variant_id = dv.id
      WHERE cp.library_entity_id IS NOT NULL
    `),
  )

  const pickInserts = pickRows.flatMap((row) => {
    const companyVariantId = companyVariantByLibrary.get(
      `${row.company_product_id}:${row.library_variant_id}`,
    )
    if (!companyVariantId) return []
    return [
      {
        company_variant_id: companyVariantId,
        library_attribute_id: row.library_attribute_id,
        library_attribute_value_id: row.library_attribute_value_id,
        company_attribute_value_id:
          valueIdByKey.get(`products:${row.company_product_id}:${row.library_attribute_value_id}`) ??
          null,
      },
    ]
  })
  await insertChunks(knex, 'company_product_variant_values', pickInserts)
}

async function backfillCustomJsonAttributes(knex: Knex): Promise<void> {
  for (const kind of GALLERY_KINDS) {
    const table =
      kind === 'products' ? 'company_products' : kind === 'services' ? 'company_services' : 'company_spaces'
    const rows = asRows<{
      id: string
      company_id: string
      library_entity_id: string | null
      attributes: string | unknown[] | null
    }>(await knex(table).select('id', 'company_id', 'library_entity_id', 'attributes'))

    for (const row of rows) {
      if (row.library_entity_id) continue
      const parsed = parseAttributesJson(row.attributes)
      if (parsed.length === 0) continue
      const existing = await knex('company_catalog_entity_attributes')
        .where({ entity_kind: kind, entity_id: row.id })
        .first()
      if (existing) continue

      for (const attr of parsed) {
        await knex('company_catalog_entity_attributes')
          .insert({
            company_id: row.company_id,
            entity_kind: kind,
            entity_id: row.id,
            library_attribute_id: attr.attributeId,
            created_at: knex.fn.now(3),
          })
          .onConflict()
          .ignore()

        for (const value of attr.values) {
          await knex('company_catalog_entity_attribute_values').insert({
            id: nanoid(),
            company_id: row.company_id,
            entity_kind: kind,
            entity_id: row.id,
            library_attribute_id: attr.attributeId,
            library_value_id: value.libraryValueId,
            value_text: value.valueText,
            value_number: value.valueNumber,
            is_default: value.isDefault,
            created_at: knex.fn.now(3),
            updated_at: knex.fn.now(3),
          })
        }
      }
    }
  }
}

async function linkStocksToCompanyVariants(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('company_product_stocks', 'company_variant_id')) {
    await knex.raw(`
      UPDATE company_product_stocks s
      INNER JOIN company_product_variants v
        ON v.company_product_id = s.company_product_id
       AND v.library_variant_id = s.library_variant_id
      SET s.company_variant_id = v.id
      WHERE s.company_variant_id IS NULL
    `)
  }
  if (await knex.schema.hasColumn('company_product_variant_stock_limits', 'company_variant_id')) {
    await knex.raw(`
      UPDATE company_product_variant_stock_limits s
      INNER JOIN company_product_variants v
        ON v.company_product_id = s.company_product_id
       AND v.library_variant_id = s.library_variant_id
      SET s.company_variant_id = v.id
      WHERE s.company_variant_id IS NULL
    `)
  }
}

type ParsedValue = {
  libraryValueId: string | null
  valueText: string | null
  valueNumber: number | null
  isDefault: boolean
}

type ParsedAttribute = {
  attributeId: string
  values: ParsedValue[]
}

function parseAttributesJson(raw: string | unknown[] | null): ParsedAttribute[] {
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as unknown
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  const result: ParsedAttribute[] = []
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const attributeId =
      typeof record.attributeId === 'string'
        ? record.attributeId
        : typeof record.attribute_id === 'string'
          ? record.attribute_id
          : null
    if (!attributeId || attributeId.length !== 21) continue
    const values: ParsedValue[] = []
    if (Array.isArray(record.values)) {
      for (const value of record.values) {
        if (!value || typeof value !== 'object') continue
        const row = value as Record<string, unknown>
        const libraryValueId = typeof row.id === 'string' && row.id.length === 21 ? row.id : null
        values.push({
          libraryValueId,
          valueText: typeof row.valueText === 'string' ? row.valueText : null,
          valueNumber: typeof row.valueNumber === 'number' ? row.valueNumber : null,
          isDefault: row.isDefault === true,
        })
      }
    } else if (record.valueText != null || record.valueNumber != null) {
      values.push({
        libraryValueId: null,
        valueText: typeof record.valueText === 'string' ? record.valueText : null,
        valueNumber: typeof record.valueNumber === 'number' ? record.valueNumber : null,
        isDefault: true,
      })
    }
    result.push({ attributeId, values })
  }
  return result
}

async function insertChunks(knex: Knex, table: string, rows: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    if (chunk.length === 0) continue
    await knex(table).insert(chunk).onConflict().ignore()
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('company_product_variant_stock_limits', 'company_variant_id')) {
    await knex.schema.alterTable('company_product_variant_stock_limits', (table) => {
      table.dropForeign(['company_variant_id'])
      table.dropColumn('company_variant_id')
    })
  }
  if (await knex.schema.hasColumn('company_product_stocks', 'company_variant_id')) {
    await knex.schema.alterTable('company_product_stocks', (table) => {
      table.dropForeign(['company_variant_id'])
      table.dropIndex(
        ['company_product_id', 'company_variant_id'],
        'company_product_stocks_company_variant_idx',
      )
      table.dropColumn('company_variant_id')
    })
  }
  await knex.schema.dropTableIfExists('company_product_variant_values')
  await knex.schema.dropTableIfExists('company_product_variants')
  await knex.schema.dropTableIfExists('company_catalog_entity_attribute_values')
  await knex.schema.dropTableIfExists('company_catalog_entity_attributes')
}
