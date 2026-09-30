import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('data_catalog_reviews', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.enu('entity_kind', ['product', 'service', 'space']).notNullable()
    table.string('entity_id', 21).notNullable()
    table.string('user_id', 21).notNullable()
    table.tinyint('rating').unsigned().notNullable()
    table.text('comment').nullable()
    table.string('source_event_id', 21).nullable()
    table.string('source_occurrence_date', 10).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.unique(['user_id', 'company_id', 'entity_kind', 'entity_id'], {
      indexName: 'data_catalog_reviews_user_item_unique',
    })
    table.index(['company_id', 'entity_kind', 'entity_id'], 'data_catalog_reviews_item_idx')
    table.index(['user_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('data_catalog_reviews')
}
