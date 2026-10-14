import type { Knex } from 'knex'

const UNIFIED = 'data_catalog_entity_tags'

const LEGACY: Array<{ table: string; idCol: string; kind: string }> = [
  { table: 'data_product_tags', idCol: 'product_id', kind: 'products' },
  { table: 'data_service_tags', idCol: 'service_id', kind: 'services' },
  { table: 'data_space_tags', idCol: 'space_id', kind: 'spaces' },
]

async function createLegacyTagTable(
  knex: Knex,
  tableName: string,
  idCol: string,
  parentTable: string,
): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string(idCol, 21).notNullable().references('id').inTable(parentTable).onDelete('CASCADE')
    table.string('tag_id', 21).notNullable().references('id').inTable('data_tags').onDelete('CASCADE')
    table.primary([idCol, 'tag_id'])
  })
}

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(UNIFIED))) {
    await knex.schema.createTable(UNIFIED, (table) => {
      table.string('entity_kind', 16).notNullable()
      table.string('entity_id', 21).notNullable()
      table.string('tag_id', 21).notNullable().references('id').inTable('data_tags').onDelete('CASCADE')
      table.primary(['entity_kind', 'entity_id', 'tag_id'])
      table.index(['tag_id'], 'data_catalog_entity_tags_tag_idx')
    })
  }

  for (const source of LEGACY) {
    if (!(await knex.schema.hasTable(source.table))) continue
    await knex.raw(
      `INSERT INTO ${UNIFIED} (entity_kind, entity_id, tag_id)
       SELECT ?, ${source.idCol}, tag_id
       FROM ${source.table}
       ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id)`,
      [source.kind],
    )
  }

  for (const source of LEGACY) {
    await knex.schema.dropTableIfExists(source.table)
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(UNIFIED))) return

  await createLegacyTagTable(knex, 'data_product_tags', 'product_id', 'data_products')
  await createLegacyTagTable(knex, 'data_service_tags', 'service_id', 'data_services')
  await createLegacyTagTable(knex, 'data_space_tags', 'space_id', 'data_spaces')

  for (const source of LEGACY) {
    await knex.raw(
      `INSERT INTO ${source.table} (${source.idCol}, tag_id)
       SELECT entity_id, tag_id
       FROM ${UNIFIED}
       WHERE entity_kind = ?
       ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id)`,
      [source.kind],
    )
  }

  await knex.schema.dropTableIfExists(UNIFIED)
}
