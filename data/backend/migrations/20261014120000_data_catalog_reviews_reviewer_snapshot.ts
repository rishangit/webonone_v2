import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_catalog_reviews', (table) => {
    table.string('reviewer_display_name', 255).nullable()
    table.string('reviewer_avatar_url', 2048).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_catalog_reviews', (table) => {
    table.dropColumn('reviewer_display_name')
    table.dropColumn('reviewer_avatar_url')
  })
}
