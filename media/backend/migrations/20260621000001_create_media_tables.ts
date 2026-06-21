import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('media_folders', (table) => {
    table.string('id', 21).primary()
    table.string('scope', 255).notNullable()
    table.string('path', 512).notNullable()
    table.string('name', 255).notNullable()
    table.string('created_by_user_id', 21).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('deleted_at', { precision: 3 }).nullable()
    table.index(['scope', 'path'])
  })

  await knex.schema.createTable('media_items', (table) => {
    table.string('id', 21).primary()
    table.string('scope', 255).notNullable()
    table.string('folder_path', 512).notNullable().defaultTo('/')
    table.string('file_name', 255).notNullable()
    table.string('storage_key', 512).notNullable()
    table.string('mime_type', 127).notNullable()
    table.bigInteger('size_bytes').unsigned().notNullable()
    table.integer('width').nullable()
    table.integer('height').nullable()
    table.string('public_url', 1024).notNullable()
    table.string('uploaded_by_user_id', 21).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('deleted_at', { precision: 3 }).nullable()
    table.index(['scope', 'folder_path'])
    table.index(['deleted_at'])
    table.index(['uploaded_by_user_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('media_items')
  await knex.schema.dropTableIfExists('media_folders')
}
