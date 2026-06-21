import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('site_media_refs', (table) => {
    table.string('id', 21).primary()
    table.string('site_id', 21).notNullable()
    table.string('media_id', 21).notNullable()
    table.string('media_url', 1024).notNullable()
    table.string('label', 255).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.index(['site_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('site_media_refs')
}
