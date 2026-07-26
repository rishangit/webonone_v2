import type { Knex } from 'knex'

const ENTITY_KINDS = ['tags', 'units', 'attributes', 'products', 'services', 'spaces'] as const
const BINDING_MODES = ['linked', 'forked', 'custom'] as const

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_catalog_items', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.enum('entity_kind', [...ENTITY_KINDS]).notNullable()
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

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_catalog_items')
}
