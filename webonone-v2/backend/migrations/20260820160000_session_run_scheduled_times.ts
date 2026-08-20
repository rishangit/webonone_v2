import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_runs', (table) => {
    table.time('scheduled_start_time').nullable()
    table.time('scheduled_end_time').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_runs', (table) => {
    table.dropColumn('scheduled_start_time')
    table.dropColumn('scheduled_end_time')
  })
}
