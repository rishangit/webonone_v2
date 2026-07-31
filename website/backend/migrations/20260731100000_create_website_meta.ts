import type { Knex } from 'knex'

/** Placeholder table so the website service owns a real schema from day one. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('website_meta', (table) => {
    table.string('id', 21).primary()
    table.string('key', 64).notNullable().unique()
    table.text('value').nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('website_meta')
}
