import type { Knex } from 'knex'

const UNIFIED = 'data_catalog_entity_attributes'

const LEGACY: Array<{ table: string; idCol: string; kind: string; parentTable: string }> = [
  { table: 'data_product_attributes', idCol: 'product_id', kind: 'products', parentTable: 'data_products' },
  { table: 'data_service_attributes', idCol: 'service_id', kind: 'services', parentTable: 'data_services' },
  { table: 'data_space_attributes', idCol: 'space_id', kind: 'spaces', parentTable: 'data_spaces' },
]

async function createLegacyAttributeTable(
  knex: Knex,
  tableName: string,
  idCol: string,
  parentTable: string,
): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string(idCol, 21).notNullable().references('id').inTable(parentTable).onDelete('CASCADE')
    table
      .string('attribute_id', 21)
      .notNullable()
      .references('id')
      .inTable('data_attributes')
      .onDelete('RESTRICT')
    table.primary([idCol, 'attribute_id'])
  })
}

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(UNIFIED))) {
    await knex.schema.createTable(UNIFIED, (table) => {
      table.string('entity_kind', 16).notNullable()
      table.string('entity_id', 21).notNullable()
      table
        .string('attribute_id', 21)
        .notNullable()
        .references('id')
        .inTable('data_attributes')
        .onDelete('RESTRICT')
      table.primary(['entity_kind', 'entity_id', 'attribute_id'])
      table.index(['attribute_id'], 'data_catalog_entity_attributes_attr_idx')
    })
  }

  for (const source of LEGACY) {
    if (!(await knex.schema.hasTable(source.table))) continue
    await knex.raw(
      `INSERT INTO ${UNIFIED} (entity_kind, entity_id, attribute_id)
       SELECT ?, ${source.idCol}, attribute_id
       FROM ${source.table}
       ON DUPLICATE KEY UPDATE attribute_id = VALUES(attribute_id)`,
      [source.kind],
    )
  }

  for (const source of LEGACY) {
    await knex.schema.dropTableIfExists(source.table)
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(UNIFIED))) return

  for (const source of LEGACY) {
    await createLegacyAttributeTable(knex, source.table, source.idCol, source.parentTable)
    await knex.raw(
      `INSERT INTO ${source.table} (${source.idCol}, attribute_id)
       SELECT entity_id, attribute_id
       FROM ${UNIFIED}
       WHERE entity_kind = ?
       ON DUPLICATE KEY UPDATE attribute_id = VALUES(attribute_id)`,
      [source.kind],
    )
  }

  await knex.schema.dropTableIfExists(UNIFIED)
}
