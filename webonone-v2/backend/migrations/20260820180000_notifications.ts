import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.string('id', 21).primary()
    table.string('user_id', 21).notNullable()
    table.string('company_id', 21).nullable()
    table.string('type', 64).notNullable()
    table.string('title', 255).notNullable()
    table.text('body').nullable()
    table.string('href', 512).nullable()
    table.string('source_service', 32).notNullable()
    table.string('source_event_id', 128).nullable()
    table.datetime('read_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))

    table.index(['user_id', 'created_at'], 'notifications_user_created_idx')
    table.index(['user_id', 'read_at'], 'notifications_user_read_idx')
    table.unique(['source_service', 'source_event_id'], {
      indexName: 'notifications_source_event_unique',
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications')
}
