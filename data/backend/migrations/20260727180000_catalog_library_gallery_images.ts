import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_products', (table) => {
    table.json('gallery_images').nullable()
  })
  await knex.schema.alterTable('data_services', (table) => {
    table.json('gallery_images').nullable()
  })
  await knex.schema.alterTable('data_spaces', (table) => {
    table.json('gallery_images').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('data_products', (table) => {
    table.dropColumn('gallery_images')
  })
  await knex.schema.alterTable('data_services', (table) => {
    table.dropColumn('gallery_images')
  })
  await knex.schema.alterTable('data_spaces', (table) => {
    table.dropColumn('gallery_images')
  })
}
