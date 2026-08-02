import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_tokens', (table) => {
    table
      .enum('status', ['waiting', 'serving', 'completed'])
      .notNullable()
      .defaultTo('waiting')
  })

  await knex.schema.createTable('company_event_session_runs', (table) => {
    table.string('id', 21).primary()
    table.string('company_id', 21).notNullable()
    table.string('event_id', 21).notNullable()
    table.date('occurrence_date').notNullable()
    table
      .enum('status', ['scheduled', 'started', 'ended'])
      .notNullable()
      .defaultTo('scheduled')
    table.string('current_token_id', 21).nullable()
    table.datetime('started_at', { precision: 3 }).nullable()
    table.string('started_by_user_id', 21).nullable()
    table.datetime('ended_at', { precision: 3 }).nullable()
    table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE')
    table.foreign('event_id').references('id').inTable('company_events').onDelete('CASCADE')
    table
      .foreign('current_token_id')
      .references('id')
      .inTable('company_event_session_tokens')
      .onDelete('SET NULL')
    table.unique(['event_id', 'occurrence_date'], {
      indexName: 'uniq_session_run_occurrence',
    })
    table.index(['company_id', 'event_id', 'occurrence_date'], 'idx_session_runs_lookup')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('company_event_session_runs')
  await knex.schema.alterTable('company_event_session_tokens', (table) => {
    table.dropColumn('status')
  })
}
