import type { Knex } from 'knex'

const UNIFIED = 'data_catalog_entity_attribute_values'
const VARIANT_VALUES = 'data_product_variant_values'

const LEGACY: Array<{ table: string; idCol: string; kind: string; parentTable: string }> = [
  {
    table: 'data_product_attribute_values',
    idCol: 'product_id',
    kind: 'products',
    parentTable: 'data_products',
  },
  {
    table: 'data_service_attribute_values',
    idCol: 'service_id',
    kind: 'services',
    parentTable: 'data_services',
  },
  {
    table: 'data_space_attribute_values',
    idCol: 'space_id',
    kind: 'spaces',
    parentTable: 'data_spaces',
  },
]

async function dropAttributeValueForeign(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(VARIANT_VALUES))) return
  await knex.schema.alterTable(VARIANT_VALUES, (table) => {
    table.dropForeign(['attribute_value_id'])
  })
}

async function createLegacyValueTable(
  knex: Knex,
  tableName: string,
  idCol: string,
  parentTable: string,
): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('id', 21).primary()
    table.string(idCol, 21).notNullable().references('id').inTable(parentTable).onDelete('CASCADE')
    table
      .string('attribute_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_attributes')
      .onDelete('RESTRICT')
    table.text('value_text').nullable()
    table.decimal('value_number', 18, 6).nullable()
    table.boolean('is_default').notNullable().defaultTo(false)
    table.timestamp('created_at', { useTz: false, precision: 3 }).notNullable()
    table.timestamp('updated_at', { useTz: false, precision: 3 }).notNullable()
    table.index([idCol, 'attribute_id'])
  })
}

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(UNIFIED))) {
    await knex.schema.createTable(UNIFIED, (table) => {
      table.string('id', 21).primary()
      table.string('entity_kind', 16).notNullable()
      table.string('entity_id', 21).notNullable()
      table
        .string('attribute_id', 21)
        .notNullable()
        .references('id')
        .inTable('data_attributes')
        .onDelete('RESTRICT')
      table.text('value_text').nullable()
      table.decimal('value_number', 18, 6).nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: false, precision: 3 }).notNullable()
      table.timestamp('updated_at', { useTz: false, precision: 3 }).notNullable()
      table.index(
        ['entity_kind', 'entity_id', 'attribute_id'],
        'data_catalog_entity_attribute_values_entity_idx',
      )
    })
  }

  for (const source of LEGACY) {
    if (!(await knex.schema.hasTable(source.table))) continue
    await knex.raw(
      `INSERT INTO ${UNIFIED} (
         id, entity_kind, entity_id, attribute_id, value_text, value_number, is_default, created_at, updated_at
       )
       SELECT id, ?, ${source.idCol}, attribute_id, value_text, value_number, is_default, created_at, updated_at
       FROM ${source.table}
       ON DUPLICATE KEY UPDATE
         entity_kind = VALUES(entity_kind),
         entity_id = VALUES(entity_id),
         attribute_id = VALUES(attribute_id),
         value_text = VALUES(value_text),
         value_number = VALUES(value_number),
         is_default = VALUES(is_default),
         created_at = VALUES(created_at),
         updated_at = VALUES(updated_at)`,
      [source.kind],
    )
  }

  await dropAttributeValueForeign(knex)

  for (const source of LEGACY) {
    await knex.schema.dropTableIfExists(source.table)
  }

  if (await knex.schema.hasTable(VARIANT_VALUES)) {
    await knex.schema.alterTable(VARIANT_VALUES, (table) => {
      table
        .foreign('attribute_value_id')
        .references('id')
        .inTable(UNIFIED)
        .onDelete('RESTRICT')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(UNIFIED))) return

  await dropAttributeValueForeign(knex)

  for (const source of LEGACY) {
    await createLegacyValueTable(knex, source.table, source.idCol, source.parentTable)
    await knex.raw(
      `INSERT INTO ${source.table} (
         id, ${source.idCol}, attribute_id, value_text, value_number, is_default, created_at, updated_at
       )
       SELECT id, entity_id, attribute_id, value_text, value_number, is_default, created_at, updated_at
       FROM ${UNIFIED}
       WHERE entity_kind = ?
       ON DUPLICATE KEY UPDATE
         attribute_id = VALUES(attribute_id),
         value_text = VALUES(value_text),
         value_number = VALUES(value_number),
         is_default = VALUES(is_default)`,
      [source.kind],
    )
  }

  if (await knex.schema.hasTable(VARIANT_VALUES)) {
    await knex.schema.alterTable(VARIANT_VALUES, (table) => {
      table
        .foreign('attribute_value_id')
        .references('id')
        .inTable('data_product_attribute_values')
        .onDelete('RESTRICT')
    })
  }

  await knex.schema.dropTableIfExists(UNIFIED)
}
