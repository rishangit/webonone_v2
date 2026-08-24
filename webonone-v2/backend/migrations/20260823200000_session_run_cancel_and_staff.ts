import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_runs', (table) => {
    table.datetime('cancelled_at', { precision: 3 }).nullable()
    table.string('staff_id', 21).nullable()
    table
      .foreign('staff_id')
      .references('id')
      .inTable('company_staff')
      .onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_event_session_runs', (table) => {
    table.dropForeign(['staff_id'])
    table.dropColumn('staff_id')
    table.dropColumn('cancelled_at')
  })
}
