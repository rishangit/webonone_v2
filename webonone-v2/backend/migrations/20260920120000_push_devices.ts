import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('push_devices', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable()
    table.string('expo_push_token', 255).notNullable()
    table.string('platform', 16).notNullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))

    table.unique(['expo_push_token'], { indexName: 'push_devices_token_unique' })
    table.index(['user_id'], 'push_devices_user_idx')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('push_devices')
}
