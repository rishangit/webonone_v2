import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('company_event_session_tokens', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('event_id', 21).notNullable()
    table.date('occurrence_date').notNullable()
    table.integer('token_number').unsigned().notNullable()
    table.string('user_id', 21).notNullable()
    table.string('user_display_name', 255).notNullable()
    table.string('user_email', 255).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.foreign('event_id').references('id').inTable('company_events').onDelete('CASCADE')
    table.unique(['event_id', 'occurrence_date', 'token_number'], {
      indexName: 'uniq_session_token_number',
    })
    table.unique(['event_id', 'occurrence_date', 'user_id'], {
      indexName: 'uniq_session_token_user',
    })
    table.index(['company_id', 'event_id', 'occurrence_date'], 'idx_session_tokens_lookup')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_event_session_tokens')
}
