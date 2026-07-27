import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_products', (table) => {
    table.json('gallery_images').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_products', (table) => {
    table.dropColumn('gallery_images')
  })
}
