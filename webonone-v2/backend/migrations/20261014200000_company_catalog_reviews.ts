import type { Knex } from 'knex'

const ENTITY_KINDS = ['product', 'service', 'space'] as const

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_catalog_reviews', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.enum('entity_kind', [...ENTITY_KINDS]).notNullable()
    table.string('entity_id', 21).notNullable()
    table.string('user_id', 21).notNullable()
    table.tinyint('rating').unsigned().notNullable()
    table.text('comment').nullable()
    table.string('source_event_id', 21).nullable()
    table.string('source_occurrence_date', 10).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.unique(['user_id', 'company_id', 'entity_kind', 'entity_id'], {
      indexName: 'company_catalog_reviews_user_item_unique',
    })
    table.index(['company_id', 'entity_kind', 'entity_id'], 'company_catalog_reviews_item_idx')
    table.index(['user_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_catalog_reviews')
}
