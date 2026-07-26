import type { Knex } from 'knex'

const BINDING_MODES = ['linked', 'forked', 'custom'] as const
const STATUSES = ['verified', 'pending'] as const

function addCommonCatalogColumns(table: Knex.CreateTableBuilder, knex: Knex) {
  table.string('id', 21).primary()
  table.string('company_id', 21).notNullable()
  table.enum('binding_mode', [...BINDING_MODES]).notNullable()
  table.string('library_entity_id', 21).nullable()
  /** Null when linked (live from Data library); required for forked/custom in app layer. */
  table.string('name', 255).nullable()
  table.text('description').nullable()
  table.enum('status', [...STATUSES]).nullable()
  table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
  table.unique(['company_id', 'library_entity_id'])
  table.index(['company_id', 'name'])
  table.index(['company_id', 'binding_mode'])
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_catalog_items')

  await knex.schema.createTable('company_catalog_tags', (table) => {
    addCommonCatalogColumns(table, knex)
    table.string('color', 7).nullable()
  })

  await knex.schema.createTable('company_units', (table) => {
    addCommonCatalogColumns(table, knex)
    table.string('symbol', 32).nullable()
    table.boolean('is_base').nullable()
    table.string('base_unit_id', 21).nullable()
  })

  await knex.schema.createTable('company_attributes', (table) => {
    addCommonCatalogColumns(table, knex)
    table.enum('value_type', ['number', 'text']).nullable()
    table.string('unit_id', 21).nullable()
    table.index(['company_id', 'value_type'])
  })

  await knex.schema.createTable('company_products', (table) => {
    addCommonCatalogColumns(table, knex)
    table.json('tag_ids').nullable()
    table.json('attributes').nullable()
  })

  await knex.schema.createTable('company_services', (table) => {
    addCommonCatalogColumns(table, knex)
    table.json('tag_ids').nullable()
    table.json('attributes').nullable()
    table.enum('time_mode', ['duration', 'window']).nullable()
    table.integer('duration_minutes').unsigned().nullable()
    table.time('start_time').nullable()
    table.time('end_time').nullable()
    table.index(['company_id', 'time_mode'])
  })

  await knex.schema.createTable('company_spaces', (table) => {
    addCommonCatalogColumns(table, knex)
    table.json('tag_ids').nullable()
    table.json('attributes').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_spaces')
  await knex.schema.dropTableIfExists('company_services')
  await knex.schema.dropTableIfExists('company_products')
  await knex.schema.dropTableIfExists('company_attributes')
  await knex.schema.dropTableIfExists('company_units')
  await knex.schema.dropTableIfExists('company_catalog_tags')

  // Restore previous single-table shape if rolling back this migration alone.
  await knex.schema.createTable('company_catalog_items', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table
      .enum('entity_kind', ['tags', 'units', 'attributes', 'products', 'services', 'spaces'])
      .notNullable()
    table.enum('binding_mode', [...BINDING_MODES]).notNullable()
    table.string('library_entity_id', 21).nullable()
    table.json('payload').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.unique(['company_id', 'entity_kind', 'library_entity_id'], {
      indexName: 'company_catalog_items_company_kind_library_unique',
    })
    table.index(['company_id', 'entity_kind'], 'company_catalog_items_company_kind_idx')
  })
}
